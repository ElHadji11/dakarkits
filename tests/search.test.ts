import { describe, expect, it } from 'vitest'

import { buildHaystack, normalise, searchItems } from '@/lib/search'

const item = (title: string, team?: string, league?: string, season?: string, aliases?: string) => ({
  title,
  haystack: buildHaystack([title, team, league, season, aliases]),
})

const catalogue = [
  item('Maillot domicile', 'FC Barcelone', 'Liga', '2024/25', 'barca, fcb, barcelona'),
  item('Maillot extérieur', 'Sénégal', null as unknown as string, '2024/25', 'lions, teranga'),
  item('Maillot rétro', 'Real Madrid', 'Liga', '1998/99', 'real, merengues'),
]

const titles = (query: string) => searchItems(catalogue, query).map((i) => i.title)

describe('normalisation', () => {
  it('strips accents and punctuation', () => {
    expect(normalise('Barça 24/25')).toBe('barca 24 25')
    expect(normalise('Sénégal')).toBe('senegal')
  })
})

describe('the two examples from the brief', () => {
  it('finds Barcelone from "barca", through the alias', () => {
    expect(titles('barca')).toEqual(['Maillot domicile'])
  })

  it('finds Sénégal from "senegal", without the accent', () => {
    expect(titles('senegal')).toEqual(['Maillot extérieur'])
  })
})

describe('matching', () => {
  it('matches on a prefix', () => {
    expect(titles('barce')).toEqual(['Maillot domicile'])
  })

  it('matches on the league', () => {
    expect(titles('liga').sort()).toEqual(['Maillot domicile', 'Maillot rétro'])
  })

  it('matches on the season', () => {
    expect(titles('1998')).toEqual(['Maillot rétro'])
  })

  it('requires every typed word to match', () => {
    expect(titles('maillot barca')).toEqual(['Maillot domicile'])
    expect(titles('maillot tottenham')).toEqual([])
  })

  it('is case insensitive', () => {
    expect(titles('BARCA')).toEqual(['Maillot domicile'])
  })
})

describe('typo tolerance', () => {
  it('forgives one wrong letter in a long enough word', () => {
    expect(titles('barcelome')).toEqual(['Maillot domicile'])
  })

  it('forgives two swapped letters', () => {
    expect(titles('barcelnoe')).toEqual(['Maillot domicile'])
  })

  it('forgives a missing letter', () => {
    expect(titles('madrd')).toEqual(['Maillot rétro'])
  })

  it('does not forgive typos in short words, which would match anything', () => {
    expect(titles('rel')).toEqual([])
  })
})

describe('empty input', () => {
  it('returns nothing rather than everything', () => {
    expect(searchItems(catalogue, '')).toEqual([])
    expect(searchItems(catalogue, '   ')).toEqual([])
  })
})
