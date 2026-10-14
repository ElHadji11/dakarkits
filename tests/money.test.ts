import { describe, expect, it } from 'vitest'

import { CFA_PER_EUR, eurFromCfa } from '@/lib/money'

/**
 * La conversion n'existe que pour Meta, mais elle décide de la valeur de
 * conversion sur laquelle les publicités optimisent. Une erreur ici ne casse
 * aucune page : elle fausse le ROAS en silence, ce qui est pire.
 */
describe('eurFromCfa', () => {
  it('est la parité fixe, pas un cours', () => {
    expect(CFA_PER_EUR).toBe(655.957)
    expect(eurFromCfa(655957)).toBe(1000)
  })

  it('arrondit au centime', () => {
    // 13 000 F, le pack de deux : 19,8184... -> 19,82.
    expect(eurFromCfa(13000)).toBe(19.82)
    // 19 500 F, le pack de trois.
    expect(eurFromCfa(19500)).toBe(29.73)
    // 6 500 F, un maillot seul.
    expect(eurFromCfa(6500)).toBe(9.91)
  })

  it('ne rend jamais plus de deux décimales', () => {
    for (const francs of [1, 7, 999, 2000, 3000, 21000, 123456]) {
      const value = eurFromCfa(francs)
      expect(Number(value.toFixed(2))).toBe(value)
    }
  })

  it('tient le zéro — livraison incluse, panier vide', () => {
    expect(eurFromCfa(0)).toBe(0)
  })

  it('est monotone : un panier plus cher ne vaut jamais moins', () => {
    let previous = -1
    for (const francs of [0, 2000, 6500, 13000, 19500, 21000]) {
      const value = eurFromCfa(francs)
      expect(value).toBeGreaterThan(previous)
      previous = value
    }
  })
})
