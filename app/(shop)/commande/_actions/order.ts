'use server'

import { and, desc, eq, gt, inArray, sql } from 'drizzle-orm'
import { cookies, headers } from 'next/headers'
import { after } from 'next/server'
import { redirect } from 'next/navigation'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'

import { submittedValues, type ActionState } from '@/lib/action-state'
import { siteUrl } from '@/lib/constants'
import { db } from '@/lib/db'
import { orderItems, orders, productSizes, products } from '@/lib/db/schema'
import { sendPurchaseToCapi } from '@/lib/meta'
import { notifyNewOrder, type OrderNotification } from '@/lib/notify'
import { calculatePricing, type PricingLine } from '@/lib/pricing'
import { clientIp, consume } from '@/lib/rate-limit'
import { getSettings } from '@/lib/settings'
import { cartLineSchema, orderSchema } from '@/lib/validation/order'

const FIELDS = ['customerName', 'phone', 'address']

/** Generous enough for a family ordering from one phone, tight enough to hurt a bot. */
const PER_IP = { limit: 6, windowSeconds: 60 * 10 }
const PER_PHONE = { limit: 3, windowSeconds: 60 * 10 }
/** Two identical submissions inside this window are the same order, twice. */
const DUPLICATE_WINDOW_MINUTES = 10

function fail(error: string, formData: FormData, fieldErrors?: Record<string, string>): ActionState {
  return { ok: false, error, fieldErrors, values: submittedValues(formData, FIELDS) }
}

/** Identifies a basket, so the same one sent twice can be recognised. */
function signature(lines: Array<{ productId: number; size: string | null; quantity: number }>) {
  return lines
    .map((line) => `${line.productId}:${line.size ?? '-'}:${line.quantity}`)
    .sort()
    .join('|')
}

export async function placeOrder(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Invisible field. A human never fills it; a bot fills everything.
  if (typeof formData.get('website') === 'string' && formData.get('website') !== '') {
    return fail('Commande refusée.', formData)
  }

  let rawLines: unknown
  try {
    rawLines = JSON.parse(String(formData.get('lines') ?? '[]'))
  } catch {
    return fail('Ton panier est illisible. Recharge la page et réessaie.', formData)
  }

  const parsed = orderSchema.safeParse({
    customerName: formData.get('customerName'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    lines: z.array(cartLineSchema).catch([]).parse(rawLines),
    attribution: {
      utmSource: formData.get('utmSource') || null,
      utmCampaign: formData.get('utmCampaign') || null,
      utmContent: formData.get('utmContent') || null,
      fbclid: formData.get('fbclid') || null,
    },
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string') fieldErrors[key] ??= issue.message
    }
    return fail(parsed.error.issues[0]!.message, formData, fieldErrors)
  }

  const input = parsed.data
  let token: string

  try {
    const ip = await clientIp()

    for (const [key, rule] of [
      [`order:ip:${ip}`, PER_IP],
      [`order:phone:${input.phone}`, PER_PHONE],
    ] as const) {
      const { ok, retryAfter } = await consume(key, rule.limit, rule.windowSeconds)
      if (!ok) {
        const minutes = Math.max(1, Math.ceil(retryAfter / 60))
        return fail(`Trop de commandes d'affilée. Réessaie dans ${minutes} minute(s).`, formData)
      }
    }

    // The browser sends product ids and sizes. Everything else — prices, pack,
    // delivery, availability — is decided here, from the database.
    const ids = [...new Set(input.lines.map((line) => line.productId))]
    const [rows, sizes, settings] = await Promise.all([
      db
        .select({
          id: products.id,
          title: products.title,
          price: products.price,
          packEligible: products.packEligible,
          status: products.status,
        })
        .from(products)
        .where(inArray(products.id, ids)),
      db.select().from(productSizes).where(inArray(productSizes.productId, ids)),
      getSettings(),
    ])

    const byId = new Map(rows.map((row) => [row.id, row]))

    for (const line of input.lines) {
      const product = byId.get(line.productId)
      if (!product || product.status !== 'published') {
        return fail('Un maillot de ton panier n’est plus en vente. Retire-le et réessaie.', formData)
      }

      const productSizeRows = sizes.filter((size) => size.productId === line.productId)

      if (productSizeRows.length === 0) {
        // No sizes at all: the jersey is sold without a size picker.
        if (line.size !== null) {
          return fail('Ce maillot se commande sans taille. Recharge la page.', formData)
        }
        continue
      }

      if (productSizeRows.every((size) => !size.available)) {
        return fail(`« ${product.title} » est épuisé. Retire-le de ton panier.`, formData)
      }
      if (line.size === null) {
        return fail(`Choisis une taille pour « ${product.title} ».`, formData)
      }
      if (!productSizeRows.some((size) => size.size === line.size && size.available)) {
        return fail(
          `La taille ${line.size} de « ${product.title} » n’est plus disponible.`,
          formData,
        )
      }
    }

    const pricingLines: PricingLine[] = input.lines.map((line) => {
      const product = byId.get(line.productId)!
      return {
        productId: line.productId,
        unitPrice: product.price,
        quantity: line.quantity,
        packEligible: product.packEligible,
      }
    })
    const pricing = calculatePricing(pricingLines, settings)

    // Same phone, same basket, same total, moments apart: one order, not two.
    const since = new Date(Date.now() - DUPLICATE_WINDOW_MINUTES * 60_000)
    const recent = await db
      .select({ id: orders.id, number: orders.number, publicToken: orders.publicToken })
      .from(orders)
      .where(and(eq(orders.phone, input.phone), gt(orders.createdAt, since)))
      .orderBy(desc(orders.createdAt))
      .limit(5)

    if (recent.length > 0) {
      const recentItems = await db
        .select()
        .from(orderItems)
        .where(
          inArray(
            orderItems.orderId,
            recent.map((row) => row.id),
          ),
        )
      const wanted = signature(input.lines)
      const duplicate = recent.find(
        (row) =>
          signature(
            recentItems
              .filter((item) => item.orderId === row.id)
              .map((item) => ({
                productId: item.productId,
                size: item.size,
                quantity: item.quantity,
              })),
          ) === wanted,
      )
      if (duplicate) {
        redirect(`/commande/confirmee/${duplicate.publicToken}`)
      }
    }

    token = randomBytes(16).toString('hex')

    const created = await db.transaction(async (tx) => {
      // The number comes from a Postgres sequence inside the insert, so two
      // simultaneous orders can never collide on it.
      const [order] = await tx
        .insert(orders)
        .values({
          number: sql`'DK-' || lpad(nextval('order_number_seq')::text, 5, '0')`,
          publicToken: token,
          customerName: input.customerName,
          phone: input.phone,
          address: input.address,
          status: 'new',
          subtotal: pricing.subtotal,
          packDiscount: pricing.packDiscount,
          shippingFee: pricing.shippingFee,
          total: pricing.total,
          utmSource: input.attribution.utmSource,
          utmCampaign: input.attribution.utmCampaign,
          utmContent: input.attribution.utmContent,
          fbclid: input.attribution.fbclid,
        })
        .returning({ id: orders.id, number: orders.number })

      await tx.insert(orderItems).values(
        input.lines.map((line) => {
          const product = byId.get(line.productId)!
          return {
            orderId: order!.id,
            productId: line.productId,
            size: line.size,
            quantity: line.quantity,
            // Frozen: editing the product later never changes this order.
            unitPrice: product.price,
            title: product.title,
          }
        }),
      )

      return order!
    })

    const notification: OrderNotification = {
      number: created.number,
      customerName: input.customerName,
      phone: input.phone,
      address: input.address,
      items: input.lines.map((line) => {
        const product = byId.get(line.productId)!
        return {
          title: product.title,
          size: line.size,
          quantity: line.quantity,
          unitPrice: product.price,
        }
      }),
      subtotal: pricing.subtotal,
      packDiscount: pricing.packDiscount,
      shippingFee: pricing.shippingFee,
      total: pricing.total,
      // `siteUrl()` et non un repli vide : sans origine, le lien de l'email et
      // du message Telegram serait relatif, donc mort hors du site.
      adminUrl: `${siteUrl()}/admin/commandes/${created.number}`,
    }

    // Read while the request is still here; `after()` runs once it is gone.
    const cookieStore = await cookies()
    const headerStore = await headers()
    const purchase = {
      // Same id the browser Pixel uses, so Meta counts the sale once.
      eventId: `purchase_${created.number}`,
      eventSourceUrl: `${siteUrl()}/commande`,
      value: pricing.total,
      contentIds: input.lines.map((line) => String(line.productId)),
      phone: input.phone,
      clientIpAddress: ip === 'unknown' ? null : ip,
      clientUserAgent: headerStore.get('user-agent'),
      fbp: cookieStore.get('_fbp')?.value ?? null,
      fbc: cookieStore.get('_fbc')?.value ?? null,
    }

    // After the response: the customer sees their confirmation immediately and
    // neither a slow mail server nor Meta can hold up, or undo, the order.
    after(async () => {
      await Promise.all([
        notifyNewOrder(notification, {
          orderEmail: settings.orderEmail,
          telegramChatId: settings.telegramChatId,
        }),
        sendPurchaseToCapi(purchase),
      ])
    })
  } catch (error) {
    // redirect() throws by design; let it through.
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error
    if (typeof error === 'object' && error !== null && 'digest' in error) throw error

    console.error('[order] failed', error)
    return fail('Impossible d’enregistrer ta commande. Réessaie dans un instant.', formData)
  }

  redirect(`/commande/confirmee/${token}`)
}
