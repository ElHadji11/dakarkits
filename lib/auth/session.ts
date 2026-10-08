import { eq } from 'drizzle-orm'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { db } from '@/lib/db'
import { adminUsers } from '@/lib/db/schema'

const COOKIE_NAME = 'dk_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days
const ALGORITHM = 'HS256'

export type AdminSession = {
  id: number
  email: string
}

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET
  if (!value || value.length < 32) {
    throw new Error('AUTH_SECRET is missing or shorter than 32 characters.')
  }
  return new TextEncoder().encode(value)
}

/** Issues the session cookie. Called only after the password has been verified. */
export async function createSession(user: {
  id: number
  email: string
  tokenVersion: number
}): Promise<void> {
  const token = await new SignJWT({ email: user.email, tv: user.tokenVersion })
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret())

  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

/**
 * Verifies the signature, then confirms the token version still matches the
 * admin row — so changing the password or the login email logs out old
 * sessions. Memoised per render pass, so a page costs one query at most.
 */
export const getSession = cache(async (): Promise<AdminSession | null> => {
  const token = (await cookies()).get(COOKIE_NAME)?.value
  if (!token) return null

  let id: number
  let tokenVersion: number
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: [ALGORITHM] })
    id = Number(payload.sub)
    tokenVersion = Number(payload.tv)
  } catch {
    return null
  }
  if (!Number.isInteger(id) || !Number.isInteger(tokenVersion)) return null

  const [user] = await db
    .select({ id: adminUsers.id, email: adminUsers.email, tokenVersion: adminUsers.tokenVersion })
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1)

  if (!user || user.tokenVersion !== tokenVersion) return null

  return { id: user.id, email: user.email }
})

/**
 * The only admin gate. Called by the admin layout and by every admin Server
 * Action — a layout check alone would not protect the actions.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getSession()
  if (!session) redirect('/admin/connexion')
  return session
}
