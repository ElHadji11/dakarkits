import { describe, expect, it } from 'vitest'

import {
  buildSuggestion,
  composeTitle,
  forbiddenWord,
  matchTeam,
  normaliseSeason,
  type TeamRow,
} from '@/lib/ai/suggest'

const teams: TeamRow[] = [
  { id: 1, name: 'Sénégal', slug: 'senegal', aliases: 'lions, teranga' },
  { id: 2, name: 'FC Barcelone', slug: 'fc-barcelone', aliases: 'barca, fcb' },
  { id: 3, name: 'Real Madrid', slug: 'real-madrid', aliases: null },
  { id: 4, name: 'Sénégal U20', slug: 'senegal-u20', aliases: null },
]

describe('forbidden vocabulary', () => {
  it.each([
    ['Maillot officiel du Sénégal', 'officiel'],
    ['Réplique authentique', 'authentique'],
    ['Tissu VÉRITABLE', 'véritable'],
    ['Maillot Sénégal domicile, flocage adidas', 'adidas'],
    ['Produit sous licence', 'licence'],
  ])('refuses %s', (text, word) => {
    expect(forbiddenWord(text)).toBe(word)
  })

  it.each([
    'Sénégal domicile 2024/25',
    'Col rond, manches courtes, bandes verticales vertes',
    // "original" is refused, but a word that merely contains it is not.
    'Coupe originalement ajustée',
  ])('accepts %s', (text) => {
    expect(forbiddenWord(text)).toBeNull()
  })

  it('looks across every text it is given', () => {
    expect(forbiddenWord('Sénégal domicile', null, 'Flocage Nike')).toBe('nike')
  })
})

describe('season', () => {
  it.each([
    ['2024/25', '2024/25'],
    ['2024/2025', '2024/25'],
    ['24/25', '2024/25'],
    ['24-25', '2024/25'],
    ['2024 / 2025', '2024/25'],
    ['2002', '2002'],
  ])('normalises %s', (input, expected) => {
    expect(normaliseSeason(input)).toBe(expected)
  })

  it.each(['saison inconnue', '', 'été 2024', '12', '1800'])('drops %s', (input) => {
    expect(normaliseSeason(input)).toBeNull()
  })
})

describe('title', () => {
  it('assembles what it has, club first', () => {
    expect(composeTitle('Sénégal', 'home', '2024/25')).toBe('Sénégal domicile 2024/25')
    expect(composeTitle('Sénégal', 'away', null)).toBe('Sénégal extérieur')
    expect(composeTitle('Real Madrid', null, null)).toBe('Real Madrid')
  })

  it('never starts with "Maillot"', () => {
    expect(composeTitle('Aston Villa', 'third', '2024/25')).toBe('Aston Villa third 2024/25')
  })

  it('composes nothing without a team', () => {
    expect(composeTitle(null, 'home', '2024/25')).toBeNull()
  })
})

describe('team matching', () => {
  it('matches on name, slug and alias', () => {
    expect(matchTeam('Sénégal', teams)?.id).toBe(1)
    expect(matchTeam('senegal', teams)?.id).toBe(1)
    expect(matchTeam('Barça', teams)?.id).toBe(2)
    expect(matchTeam('FCB', teams)?.id).toBe(2)
  })

  it('prefers an exact match over a longer name that contains it', () => {
    // "Sénégal U20" sits in the list too, and contains "senegal".
    expect(matchTeam('Sénégal', teams)?.id).toBe(1)
  })

  it('falls back to containment', () => {
    expect(matchTeam('Barcelone', teams)?.id).toBe(2)
    expect(matchTeam('Real Madrid CF', teams)?.id).toBe(3)
  })

  it('returns null rather than a bad guess', () => {
    expect(matchTeam('Al Nassr', teams)).toBeNull()
    expect(matchTeam('', teams)).toBeNull()
    expect(matchTeam(null, teams)).toBeNull()
    // Too short to be matched by containment against anything.
    expect(matchTeam('FC', teams)).toBeNull()
  })
})

describe('building a suggestion', () => {
  it('turns a model answer into form fields', () => {
    const suggestion = buildSuggestion(
      {
        team: 'Barça',
        kitType: 'away',
        season: '2024/2025',
        isRetro: false,
        title: 'ignoré, une équipe a été reconnue',
        description: 'Col rond, manches courtes, rayures bleu et grenat.',
        notes: 'écusson illisible',
      },
      teams,
    )

    expect(suggestion.fields).toEqual({
      // Our own wording, not the model's, as soon as a team is named.
      title: 'Barça extérieur 2024/25',
      description: 'Col rond, manches courtes, rayures bleu et grenat.',
      season: '2024/25',
      kitType: 'away',
      teamId: 2,
      isRetro: false,
    })
    expect(suggestion.unknownTeam).toBeNull()
    expect(suggestion.notes).toBe('écusson illisible')
    expect(suggestion.refused).toBeNull()
  })

  it('reports a team no row matches, and still fills the rest', () => {
    const suggestion = buildSuggestion(
      { team: 'Al Nassr', kitType: 'home', season: null, isRetro: null, title: null, description: 'Jaune et bleu.', notes: null },
      teams,
    )

    expect(suggestion.fields.teamId).toBeNull()
    expect(suggestion.fields.title).toBe('Al Nassr domicile')
    expect(suggestion.fields.kitType).toBe('home')
    expect(suggestion.unknownTeam).toBe('Al Nassr')
  })

  it('drops only the text that carries a forbidden word', () => {
    const suggestion = buildSuggestion(
      {
        team: 'Sénégal',
        kitType: 'home',
        season: null,
        isRetro: null,
        title: null,
        description: 'Maillot authentique, tissu respirant.',
        notes: null,
      },
      teams,
    )

    expect(suggestion.fields.description).toBeNull()
    expect(suggestion.refused).toBe('authentique')
    // The fields that were fine are kept.
    expect(suggestion.fields.title).toBe('Sénégal domicile')
    expect(suggestion.fields.teamId).toBe(1)
  })

  it('keeps the model title when no team was identified', () => {
    const suggestion = buildSuggestion(
      { team: null, kitType: null, season: null, isRetro: true, title: 'Rétro rouge et noir', description: null, notes: null },
      teams,
    )

    expect(suggestion.fields.title).toBe('Rétro rouge et noir')
    expect(suggestion.fields.isRetro).toBe(true)
  })

  it('survives junk', () => {
    for (const raw of [null, 'nope', 42, {}, { team: 12, kitType: 'fourth', season: 99, isRetro: 'oui' }]) {
      const suggestion = buildSuggestion(raw, teams)
      expect(suggestion.fields.teamId).toBeNull()
      expect(suggestion.fields.kitType).toBeNull()
      expect(suggestion.fields.title).toBeNull()
      expect(suggestion.fields.isRetro).toBe(false)
    }
  })
})
