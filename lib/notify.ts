import 'server-only'

import { formatCfa, formatCfaRange } from '@/lib/constants'
import type { DeliveryZone } from '@/lib/pricing'

export type OrderNotification = {
  number: string
  customerName: string
  /** Stored form: +2217XXXXXXXX. */
  phone: string
  address: string
  items: Array<{ title: string; size: string | null; quantity: number; unitPrice: number }>
  subtotal: number
  packDiscount: number
  shippingFee: number
  /** Égal à `shippingFee` dans la zone ; le haut de l'intervalle en dehors. */
  shippingFeeMax: number
  total: number
  totalMax: number
  zone: DeliveryZone
  adminUrl: string
}

/**
 * Ce qu'on encaisse, et la seule ligne que celui qui appelle doit lire avant
 * de composer le numéro.
 *
 * Hors zone, c'est un intervalle : le montant exact se fixe pendant cet appel,
 * et l'annoncer comme un chiffre ferme dans la notification, c'est l'oublier.
 */
function amountDue(order: OrderNotification): string {
  return formatCfaRange(order.total, order.totalMax)
}

/** « 2 000 à 3 000 F · hors zone BRT, à fixer à l'appel », ou « incluse ». */
function shippingLine(order: OrderNotification): string {
  if (order.zone === 'outside') {
    return `${formatCfaRange(order.shippingFee, order.shippingFeeMax)} · hors zone BRT, à fixer à l'appel`
  }
  return order.shippingFee > 0 ? formatCfa(order.shippingFee) : 'incluse · zone BRT'
}

/** Recipients live in the settings row, not in environment variables. */
export type NotifyTargets = {
  orderEmail: string | null
  telegramChatId: string | null
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function lines(order: OrderNotification): string[] {
  return order.items.map(
    (item) =>
      `${item.quantity} × ${item.title}${item.size ? ` (${item.size})` : ''} — ${formatCfa(
        item.unitPrice * item.quantity,
      )}`,
  )
}

function emailHtml(order: OrderNotification): string {
  const rows = lines(order)
    .map((line) => `<li style="margin:0 0 4px">${escapeHtml(line)}</li>`)
    .join('')

  // Plain inline HTML: one short email, readable on a phone, no build step.
  return `<!doctype html><html lang="fr"><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<h2 style="margin:0 0 4px">Nouvelle commande ${escapeHtml(order.number)}</h2>
<p style="margin:0 0 16px;font-size:20px"><strong>${amountDue(order)}</strong> à encaisser à la livraison</p>
<p style="margin:0 0 4px"><strong>${escapeHtml(order.customerName)}</strong></p>
<p style="margin:0 0 4px"><a href="tel:${escapeHtml(order.phone)}">${escapeHtml(order.phone)}</a>
 · <a href="https://wa.me/${escapeHtml(order.phone.replace('+', ''))}">WhatsApp</a></p>
<p style="margin:0 0 16px;white-space:pre-line">${escapeHtml(order.address)}</p>
<ul style="margin:0 0 16px;padding-left:18px">${rows}</ul>
<p style="margin:0 0 4px">Sous-total ${formatCfa(order.subtotal)}</p>
${order.packDiscount > 0 ? `<p style="margin:0 0 4px">Remise pack − ${formatCfa(order.packDiscount)}</p>` : ''}
<p style="margin:0 0 16px">Livraison ${escapeHtml(shippingLine(order))}</p>
<p style="margin:0"><a href="${escapeHtml(order.adminUrl)}">Ouvrir dans l'admin</a></p>
</body></html>`
}

function telegramHtml(order: OrderNotification): string {
  const rows = lines(order)
    .map((line) => `• ${escapeHtml(line)}`)
    .join('\n')

  return [
    `<b>Nouvelle commande ${escapeHtml(order.number)}</b>`,
    `<b>${amountDue(order)}</b> à encaisser à la livraison`,
    `Livraison : ${escapeHtml(shippingLine(order))}`,
    '',
    escapeHtml(order.customerName),
    `<a href="tel:${escapeHtml(order.phone)}">${escapeHtml(order.phone)}</a> · <a href="https://wa.me/${escapeHtml(order.phone.replace('+', ''))}">WhatsApp</a>`,
    escapeHtml(order.address),
    '',
    rows,
    '',
    `<a href="${escapeHtml(order.adminUrl)}">Ouvrir dans l'admin</a>`,
  ].join('\n')
}

async function sendEmail(order: OrderNotification, to: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  if (!apiKey || !from) throw new Error('RESEND_API_KEY or RESEND_FROM is missing.')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Commande ${order.number} — ${amountDue(order)}`,
      html: emailHtml(order),
    }),
  })

  if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`)

  // A silent success is a success you cannot diagnose. The id is what you look
  // up in the Resend dashboard when an order "never arrived".
  const { id } = (await response.json()) as { id?: string }
  console.info(`[notify] email sent for ${order.number} (resend id ${id ?? 'unknown'})`)
}

async function sendTelegram(order: OrderNotification, chatId: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is missing.')

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: telegramHtml(order),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  })

  if (!response.ok) throw new Error(`Telegram ${response.status}: ${await response.text()}`)

  console.info(`[notify] telegram sent for ${order.number}`)
}

/**
 * Fire-and-forget, called from `after()`. Each channel is independent and
 * neither can fail the order: a failure is logged and the order still exists.
 * That is the rule the brief sets, and it is the one that matters — an order
 * lost because an email bounced is a sale lost.
 */
export async function notifyNewOrder(
  order: OrderNotification,
  targets: NotifyTargets,
): Promise<void> {
  const jobs: Array<Promise<void>> = []

  if (targets.orderEmail) {
    jobs.push(
      sendEmail(order, targets.orderEmail).catch((error: unknown) => {
        console.error(`[notify] email failed for ${order.number}`, error)
      }),
    )
  } else {
    console.warn(`[notify] no order email configured; skipping email for ${order.number}`)
  }

  if (targets.telegramChatId) {
    jobs.push(
      sendTelegram(order, targets.telegramChatId).catch((error: unknown) => {
        console.error(`[notify] telegram failed for ${order.number}`, error)
      }),
    )
  } else {
    console.warn(`[notify] no telegram chat id configured; skipping for ${order.number}`)
  }

  await Promise.all(jobs)
}
