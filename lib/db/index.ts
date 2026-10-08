import { Pool, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'

import * as schema from './schema'

// The Neon driver ships no WebSocket of its own. Node 22+ has a global one,
// which is what both Vercel and local development run on. We use the WebSocket
// pool rather than the HTTP driver because stock updates need real transactions.
neonConfig.webSocketConstructor ??= globalThis.WebSocket

// Reused across hot reloads in development so we don't leak connections. The
// URL is kept alongside it: `next dev` reloads .env.local in place, and a pool
// cached before the variable existed would otherwise keep failing for the rest
// of the session.
const globalForDb = globalThis as unknown as { pool?: Pool; poolUrl?: string }

// No validation at import time on purpose: this module is loaded while
// prerendering pages that never query, and a missing variable there would fail
// the build instead of the request. A query without DATABASE_URL fails loudly
// on its own.
const url = process.env.DATABASE_URL

if (!globalForDb.pool || globalForDb.poolUrl !== url) {
  void globalForDb.pool?.end().catch(() => {})
  globalForDb.pool = new Pool({ connectionString: url })
  globalForDb.poolUrl = url
}

export const db = drizzle(globalForDb.pool, { schema })

export { schema }
