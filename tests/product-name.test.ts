import { describe, expect, it } from 'vitest'

import { composeName, productName, productSubtitle, type ShopProduct } from '@/lib/shop-types'

/**
 * Les quatre cas qui ont motivé `productName`, relevés sur le catalogue en
 * service : un titre en anglais sous une équipe française, un titre qui répète
 * le nom de l'équipe, un titre en bas de casse avec un mot anglais, et une
 * carte sans sous-titre. Les trois premiers ne doivent plus pouvoir
 * s'afficher ; le quatrième est normal et doit le rester.
 */
function product(overrides: Partial<ShopProduct>): ShopProduct {
  return {
    id: 1,
    slug: 'maillot',
    title: '',
    price: 8000,
    compareAtPrice: null,
    isRetro: false,
    packEligible: true,
    season: null,
    kitType: null,
    teamId: null,
    teamName: null,
    teamType: null,
    leagueId: null,
    leagueName: null,
    imageUrl: null,
    sizes: [],
    haystack: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('productName', () => {
  it('ignores a stored title that disagrees with the linked team', () => {
    const name = productName(
      product({ title: 'Barcelona', teamName: 'FC Barcelone', kitType: 'home', season: '2026/27' }),
    )
    expect(name).toBe('FC Barcelone · Domicile 2026/27')
  })

  it('never repeats the team twice', () => {
    const chelsea = product({ title: 'Chelsea', teamName: 'Chelsea', kitType: 'away' })
    expect(productName(chelsea)).toBe('Chelsea · Extérieur')
    expect(productSubtitle(chelsea)).toBeNull()
  })

  it('keeps the kit type in French, capitalised', () => {
    const name = productName(
      product({ title: 'Aston villa third', teamName: 'Aston Villa', kitType: 'third' }),
    )
    expect(name).toBe('Aston Villa · Third')
  })

  it('falls back to the stored title with no team linked', () => {
    expect(productName(product({ title: 'Rétro rouge et noir' }))).toBe('Rétro rouge et noir')
  })

  it('omits what it does not know rather than inventing', () => {
    expect(productName(product({ title: 'x', teamName: 'Sénégal' }))).toBe('Sénégal')
    expect(productName(product({ title: 'x', teamName: 'Sénégal', season: '2026/27' }))).toBe(
      'Sénégal · 2026/27',
    )
  })

  it('composes from raw values, for the AI and the backfill script', () => {
    expect(composeName('Real Madrid', 'home', '2026/27')).toBe('Real Madrid · Domicile 2026/27')
    expect(composeName(null, 'home', '2026/27')).toBeNull()
  })
})

describe('productSubtitle', () => {
  it('shows the league, which the name does not carry', () => {
    expect(productSubtitle(product({ teamName: 'Chelsea', leagueName: 'Premier League' }))).toBe(
      'Premier League',
    )
  })

  // Une sélection nationale n'a pas de ligue : la carte n'a donc pas de
  // sous-titre, et c'est voulu, pas un oubli.
  it('has nothing to show for a national team', () => {
    expect(productSubtitle(product({ teamName: 'Sénégal', leagueName: null }))).toBeNull()
  })
})
