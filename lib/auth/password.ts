import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>

// scrypt from node:crypto — no dependency, and strong at these parameters.
// N = 2^15 needs ~32 MB (128 * N * r), above Node's default maxmem, so we raise it.
const PARAMS = { N: 2 ** 15, r: 8, p: 1, maxmem: 96 * 1024 * 1024 }
const KEY_LENGTH = 64

/** Returns a self-describing hash: scrypt$N$r$p$salt$key, all base64url. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scryptAsync(password.normalize('NFKC'), salt, KEY_LENGTH, PARAMS)
  const { N, r, p } = PARAMS
  return ['scrypt', N, r, p, salt.toString('base64url'), key.toString('base64url')].join('$')
}

/** Constant-time check that reads its parameters from the stored hash. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false

  const [, rawN, rawR, rawP, rawSalt, rawKey] = parts
  const N = Number(rawN)
  const r = Number(rawR)
  const p = Number(rawP)
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false

  const expected = Buffer.from(rawKey, 'base64url')
  const salt = Buffer.from(rawSalt, 'base64url')

  let actual: Buffer
  try {
    actual = await scryptAsync(password.normalize('NFKC'), salt, expected.length, {
      N,
      r,
      p,
      maxmem: Math.max(PARAMS.maxmem, 256 * N * r),
    })
  } catch {
    return false
  }

  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
