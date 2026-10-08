import { describe, expect, it } from 'vitest'

import { normalisePhone } from '@/lib/validation/order'

describe('Senegalese mobile numbers', () => {
  it.each([
    ['771234567', '+221771234567'],
    ['77 123 45 67', '+221771234567'],
    ['77-123-45-67', '+221771234567'],
    ['+221771234567', '+221771234567'],
    ['221771234567', '+221771234567'],
    ['+221 77 123 45 67', '+221771234567'],
    ['  781234567  ', '+221781234567'],
    ['701234567', '+221701234567'],
  ])('normalises %s', (input, expected) => {
    expect(normalisePhone(input)).toBe(expected)
  })

  it.each([
    ['671234567', 'does not start with 7'],
    ['7712345', 'too short'],
    ['7712345678', 'too long'],
    ['', 'empty'],
    ['abcdefghi', 'not digits'],
    ['+33612345678', 'another country'],
  ])('rejects %s (%s)', (input) => {
    expect(normalisePhone(input)).toBeNull()
  })
})
