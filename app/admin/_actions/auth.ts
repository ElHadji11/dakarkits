'use server'

import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { createSession, destroySession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { adminUsers } from '@/lib/db/schema'
import { clientIp, consume, reset } from '@/lib/rate-limit'
import { loginSchema } from '@/lib/validation/auth'

const MAX_ATTEMPTS = 5
const WINDOW_SECONDS = 60 * 15

export type LoginState = { error: string | null }

// Verifying against a throwaway hash when the email is unknown keeps the
// response time the same whether or not the account exists.
let decoyHash: Promise<string> | null = null
function decoy(): Promise<string> {
  decoyHash ??= hashPassword('dakarkits-no-such-account')
  return decoyHash
}

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]!.message }
  }
  const { email, password } = parsed.data

  // Two counters: one per address, one per email, so neither a single machine
  // nor a single account can be hammered.
  const keys = [`login:ip:${await clientIp()}`, `login:email:${email}`]

  let user: typeof adminUsers.$inferSelect | undefined
  try {
    for (const key of keys) {
      const { ok, retryAfter } = await consume(key, MAX_ATTEMPTS, WINDOW_SECONDS)
      if (!ok) {
        const minutes = Math.max(1, Math.ceil(retryAfter / 60))
        return { error: `Trop de tentatives. Réessaie dans ${minutes} minute(s).` }
      }
    }
    ;[user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1)
  } catch (error) {
    // A database outage must not surface a stack trace on the login screen.
    console.error('[login] database unavailable', error)
    return { error: 'Service momentanément indisponible. Réessaie dans un instant.' }
  }

  const valid = await verifyPassword(password, user?.passwordHash ?? (await decoy()))
  if (!user || !valid) {
    return { error: 'Email ou mot de passe incorrect.' }
  }

  await Promise.all(keys.map(reset))
  await createSession(user)
  redirect('/admin')
}

export async function logout(): Promise<void> {
  await destroySession()
  redirect('/admin/connexion')
}
