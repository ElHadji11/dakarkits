import {
  boolean,
  index,
  integer,
  pgEnum,
  pgSequence,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core'

import { SIZES } from '@/lib/constants'

/* ---------------------------------------------------------------- enums --- */

export const teamTypeEnum = pgEnum('team_type', ['club', 'national'])
export const kitTypeEnum = pgEnum('kit_type', ['home', 'away', 'third'])
export const productStatusEnum = pgEnum('product_status', ['draft', 'published'])
export const sizeEnum = pgEnum('size', SIZES)
export const orderStatusEnum = pgEnum('order_status', ['new', 'delivered', 'cancelled'])
export const shippingModeEnum = pgEnum('shipping_mode', ['fee', 'included'])

/** Feeds the human-readable order number: DK-00042. */
export const orderNumberSeq = pgSequence('order_number_seq', { startWith: 1 })

/* -------------------------------------------------------------- catalog --- */

export const leagues = pgTable('leagues', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  country: text('country'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const teams = pgTable(
  'teams',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    slug: varchar('slug', { length: 120 }).notNull().unique(),
    type: teamTypeEnum('type').notNull(),
    /** Null for national selections, which belong to no league. */
    leagueId: integer('league_id').references(() => leagues.id, { onDelete: 'set null' }),
    logoUrl: text('logo_url'),
    /** Comma-separated search aliases, e.g. "barca, fcb". */
    aliases: text('aliases'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('teams_league_id_idx').on(t.leagueId)],
)

export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    // Only title, slug and price are required.
    title: text('title').notNull(),
    slug: varchar('slug', { length: 160 }).notNull().unique(),
    /** CFA francs, stored as an integer. Never a float. */
    price: integer('price').notNull(),
    teamId: integer('team_id').references(() => teams.id, { onDelete: 'set null' }),
    season: varchar('season', { length: 40 }),
    kitType: kitTypeEnum('kit_type'),
    description: text('description'),
    isRetro: boolean('is_retro').notNull().default(false),
    /** Shown struck through, only when greater than price. */
    compareAtPrice: integer('compare_at_price'),
    status: productStatusEnum('status').notNull().default('draft'),
    packEligible: boolean('pack_eligible').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('products_status_idx').on(t.status),
    index('products_team_id_idx').on(t.teamId),
    index('products_created_at_idx').on(t.createdAt),
  ],
)

export const productImages = pgTable(
  'product_images',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    /** ImageKit identifiers, needed to delete or re-transform the file later. */
    fileId: text('file_id'),
    filePath: text('file_path'),
    /**
     * The untouched upload, kept when `url` points at a baked, background-removed
     * copy. "Garde toujours l'original" — this is what makes it recoverable.
     */
    originalFilePath: text('original_file_path'),
    position: integer('position').notNull().default(0),
    isPrimary: boolean('is_primary').notNull().default(false),
    /** True when this row points at the baked background-removed file. */
    bgRemoved: boolean('bg_removed').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('product_images_product_id_idx').on(t.productId)],
)

/**
 * Sizes carry three distinct states, and the difference matters:
 *   - no row at all      -> jersey without sizes, orderable with no size picker
 *   - a row, available   -> orderable in that size
 *   - a row, unavailable -> out of stock; all rows unavailable means "Épuisé"
 * Unchecking a size in the admin keeps the row with available = false.
 * It is never deleted, so the entered quantity survives.
 */
export const productSizes = pgTable(
  'product_sizes',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    size: sizeEnum('size').notNull(),
    available: boolean('available').notNull().default(true),
    /** Null means no stock tracking at all: no count, no alert. */
    quantity: integer('quantity'),
  },
  (t) => [unique('product_sizes_product_id_size_key').on(t.productId, t.size)],
)

/* ----------------------------------------------------------------- admin --- */

export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  /** Bumped on password or email change so existing JWTs stop being accepted. */
  tokenVersion: integer('token_version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/* ---------------------------------------------------------------- orders --- */

export const orders = pgTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    /** Human-readable, from order_number_seq: DK-00042. */
    number: varchar('number', { length: 16 }).notNull().unique(),
    /**
     * Unguessable key for the confirmation page. Order numbers run in sequence,
     * so a URL built from one would let anyone read the next customer's order.
     */
    publicToken: varchar('public_token', { length: 32 }).notNull().unique(),
    customerName: text('customer_name').notNull(),
    /** Stored as +2217XXXXXXXX. */
    phone: varchar('phone', { length: 20 }).notNull(),
    address: text('address').notNull(),
    status: orderStatusEnum('status').notNull().default('new'),
    cancelReason: text('cancel_reason'),
    // All amounts in CFA francs, computed server-side only.
    subtotal: integer('subtotal').notNull(),
    packDiscount: integer('pack_discount').notNull().default(0),
    shippingFee: integer('shipping_fee').notNull().default(0),
    total: integer('total').notNull(),
    // Ad attribution.
    utmSource: text('utm_source'),
    utmCampaign: text('utm_campaign'),
    utmContent: text('utm_content'),
    fbclid: text('fbclid'),
    /** Reserved for future delivery zones. No interface for now. */
    deliveryZone: text('delivery_zone'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  },
  (t) => [
    index('orders_status_idx').on(t.status),
    index('orders_created_at_idx').on(t.createdAt),
    index('orders_phone_idx').on(t.phone),
  ],
)

/** Lines freeze price and title: editing a product never changes a past order. */
export const orderItems = pgTable(
  'order_items',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    /** restrict: a product with orders is unpublished, never deleted. */
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    /** Null when the product has no sizes at all. */
    size: sizeEnum('size'),
    quantity: integer('quantity').notNull(),
    unitPrice: integer('unit_price').notNull(),
    title: text('title').notNull(),
    /** Reserved for future name printing. */
    customization: text('customization'),
  },
  (t) => [
    index('order_items_order_id_idx').on(t.orderId),
    index('order_items_product_id_idx').on(t.productId),
  ],
)

/* -------------------------------------------------------------- settings --- */

/** Single row, id = 1. Read by /admin/reglages and /admin/profil. */
export const settings = pgTable('settings', {
  id: integer('id').primaryKey().default(1),
  packEnabled: boolean('pack_enabled').notNull().default(true),
  packSize: integer('pack_size').notNull().default(2),
  packPrice: integer('pack_price').notNull().default(13000),
  shippingMode: shippingModeEnum('shipping_mode').notNull().default('fee'),
  shippingFee: integer('shipping_fee').notNull().default(1000),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(2),
  shopPhone: varchar('shop_phone', { length: 20 }),
  shopWhatsapp: varchar('shop_whatsapp', { length: 20 }),
  orderEmail: varchar('order_email', { length: 255 }),
  telegramChatId: varchar('telegram_chat_id', { length: 64 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/* ------------------------------------------------------------ rate limit --- */

/**
 * Fixed-window counters. Postgres rather than memory, because a serverless
 * invocation keeps nothing between requests.
 */
export const rateLimits = pgTable('rate_limits', {
  key: varchar('key', { length: 255 }).primaryKey(),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull().defaultNow(),
  count: integer('count').notNull().default(0),
})

/* ----------------------------------------------------------------- types --- */

export type League = typeof leagues.$inferSelect
export type Team = typeof teams.$inferSelect
export type Product = typeof products.$inferSelect
export type ProductImage = typeof productImages.$inferSelect
export type ProductSize = typeof productSizes.$inferSelect
export type AdminUser = typeof adminUsers.$inferSelect
export type Order = typeof orders.$inferSelect
export type OrderItem = typeof orderItems.$inferSelect
export type Settings = typeof settings.$inferSelect
export type { Size } from '@/lib/constants'
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number]

export { SIZES } from '@/lib/constants'
