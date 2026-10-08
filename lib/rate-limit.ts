import { sql } from 'drizzle-orm'
import { headers } from 'next/headers'

import { db } from '@/lib/db'

export type RateLimitResult = {
  ok: boolean
  /** Seconds until the window resets. Zero when the request is allowed. */
  retryAfter: number
}

/**
 * Fixed-window counter in a single atomic statement: the upsert either starts a
 * new window or increments the current one, so two concurrent requests can
 * never both read the same stale count.
 */
export async function consume(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const result = await db.execute(sql`
    insert into rate_limits (key, window_start, count)
    values (${key}, now(), 1)
    on conflict (key) do update set
      count = case
        when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
        then 1 else rate_limits.count + 1 end,
      window_start = case
        when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
        then now() else rate_limits.window_start end
    returning count,
      greatest(0, ceil(extract(epoch from
        (window_start + make_interval(secs => ${windowSeconds})) - now()
      )))::int as retry_after
  `)

  const row = result.rows[0] as { count: number; retry_after: number } | undefined
  if (!row) return { ok: true, retryAfter: 0 }

  const ok = Number(row.count) <= limit
  return { ok, retryAfter: ok ? 0 : Number(row.retry_after) }
}

/** Clears a counter, so a successful login doesn't leave the attempts standing. */
export async function reset(key: string): Promise<void> {
  await db.execute(sql`delete from rate_limits where key = ${key}`)
}

/** Best-effort client IP. Returns 'unknown' rather than throwing. */
export async function clientIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return h.get('x-real-ip')?.trim() || 'unknown'
}
