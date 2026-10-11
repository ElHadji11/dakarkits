/**
 * Everything about an AI field suggestion that can be decided without the
 * network: the shape we accept back, the vocabulary we refuse to put in the
 * shop, the title we compose ourselves and the match from a free-text team
 * name to a row of `teams`.
 *
 * No `server-only`, no database import: the rules are testable on their own.
 */

import { z } from 'zod'

import { KIT_TYPES } from '@/lib/constants'
import { composeName } from '@/lib/shop-types'
import { slugify } from '@/lib/slug'

export type KitType = (typeof KIT_TYPES)[number]['value']

/**
 * Two reasons a text is thrown away, both straight out of AGENTS.md:
 *
 *   1. A claim of authenticity. We sell replicas; "officiel" or "authentique"
 *      is a promise the parcel cannot keep, and the brief forbids it outright.
 *   2. The name of a kit manufacturer. Meta and TikTok match brand names in ad
 *      copy, and a flagged ad account is the end of the shop's only traffic.
 *
 * Matching happens on slugified text, so accents and case never matter.
 */
export const FORBIDDEN_WORDS = [
  'officiel',
  'officielle',
  'officiels',
  'officielles',
  'authentique',
  'authentiques',
  'original',
  'originale',
  'originaux',
  'originales',
  'véritable',
  'véritables',
  'certifié',
  'certifiée',
  'licence',
  'licencié',
  'adidas',
  'nike',
  'puma',
  'jordan',
  'kappa',
  'umbro',
  'castore',
  'hummel',
  'macron',
  'joma',
  'new balance',
] as const

/** The first forbidden word found across the given texts, or null. */
export function forbiddenWord(...texts: Array<string | null | undefined>): string | null {
  const haystack = `-${texts
    .filter((text): text is string => Boolean(text))
    .map((text) => slugify(text))
    .join('-')}-`

  for (const word of FORBIDDEN_WORDS) {
    if (haystack.includes(`-${slugify(word)}-`)) return word
  }
  return null
}

/** Football seasons run August to May, so a date is enough to name one. */
export function currentSeason(now: Date): string {
  const year = now.getUTCFullYear()
  const start = now.getUTCMonth() >= 7 ? year : year - 1
  return `${start}/${String((start + 1) % 100).padStart(2, '0')}`
}

/** Blank, missing and absurdly long values all become null, never an error. */
function optionalText(max: number) {
  return z.preprocess((value) => {
    const trimmed = typeof value === 'string' ? value.trim() : ''
    return trimmed.length === 0 || trimmed.length > max ? null : trimmed
  }, z.string().nullable())
}

const KIT_TYPE_VALUES = KIT_TYPES.map((option) => option.value) as [KitType, ...KitType[]]

/**
 * What we accept back from the model. Every field is nullable and every field
 * falls back to null rather than failing: one unreadable value must not cost
 * the four that were right.
 */
export const rawSuggestionSchema = z.object({
  team: optionalText(80),
  kitType: z.enum(KIT_TYPE_VALUES).nullable().catch(null),
  season: optionalText(20),
  isRetro: z.boolean().nullable().catch(null),
  title: optionalText(160),
  description: optionalText(1200),
  notes: optionalText(200),
  sourceUrl: optionalText(500),
})

/**
 * "2024/2025", "24-25" and "2024 / 25" all come back as "2024/25", the form's
 * own placeholder. Anything that is not a season at all becomes null: the model
 * cannot read a season off a photo, so a wrong guess here is the likeliest one.
 */
export function normaliseSeason(input: string | null): string | null {
  if (!input) return null

  const pair = input.match(/^(\d{2}|\d{4})\s*[/\-–]\s*(\d{2}|\d{4})$/)
  if (pair) {
    const start = pair[1]!.length === 2 ? `20${pair[1]}` : pair[1]!
    const end = pair[2]!.slice(-2)
    return `${start}/${end}`
  }

  const single = input.match(/^(19|20)\d{2}$/)
  return single ? input : null
}

/**
 * « Sénégal · Domicile 2024/25 », assemblé de la même façon à chaque fois.
 *
 * Le format vient de `composeName` (`lib/shop-types`), celui-là même que les
 * cartes et la fiche produit utilisent pour afficher un nom : le titre proposé
 * par l'IA naît donc déjà sous la forme que la boutique affichera, et un
 * changement de format n'a qu'un seul endroit à toucher. C'est ce qui a
 * remplacé « Aston villa third 2024/25 » — minuscules et anglais mélangés,
 * parce que le libellé du type était recopié en bas de casse ici.
 *
 * Il ne commence jamais par « Maillot » : tout le catalogue en est, le mot ne
 * porte rien et pousse le club hors du premier regard — sur une carte de
 * téléphone, hors de la ligne visible.
 */
export function composeTitle(
  team: string | null,
  kitType: KitType | null,
  season: string | null,
): string | null {
  return composeName(team, kitType, season)
}

/** Only http(s) reaches the admin's screen as a link. */
export function httpUrl(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export type TeamRow = { id: number; name: string; slug: string; aliases: string | null }

/**
 * Free-text team name to an existing row. Exact slug matches come first across
 * every team, so "senegal" never lands on "Sénégal U20" while the real row is
 * further down the list. Containment is the fallback, and only from four
 * characters up: a shorter needle matches half the catalogue.
 */
export function matchTeam(name: string | null, teams: TeamRow[]): TeamRow | null {
  if (!name) return null
  const target = slugify(name)
  if (!target) return null

  const keysOf = (team: TeamRow) => [
    team.slug,
    slugify(team.name),
    ...(team.aliases ?? '')
      .split(',')
      .map((alias) => slugify(alias))
      .filter(Boolean),
  ]

  const exact = teams.find((team) => keysOf(team).includes(target))
  if (exact) return exact

  if (target.length < 4) return null
  return (
    teams.find((team) =>
      keysOf(team).some((key) => key.length >= 4 && (key.includes(target) || target.includes(key))),
    ) ?? null
  )
}

export type SuggestedFields = {
  title: string | null
  description: string | null
  season: string | null
  kitType: KitType | null
  teamId: number | null
  isRetro: boolean
}

export type Suggestion = {
  fields: SuggestedFields
  /** The team the model read off the photo, when no row of `teams` matches. */
  unknownTeam: string | null
  /** The model's own caveat, shown as is: "écusson illisible". */
  notes: string | null
  /**
   * The page the model says establishes the season. Shown to the admin so a
   * season can be checked in one click rather than trusted — a model that
   * searched and a model that remembered look identical otherwise.
   */
  sourceUrl: string | null
  /** The word that got a text dropped, if one did. */
  refused: string | null
}

/**
 * Model output to form fields. A forbidden word drops the text that carries it
 * and nothing else: the team and the kit type stay useful even when the
 * description has to go.
 */
export function buildSuggestion(raw: unknown, teams: TeamRow[]): Suggestion {
  const parsed = rawSuggestionSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      fields: {
        title: null,
        description: null,
        season: null,
        kitType: null,
        teamId: null,
        isRetro: false,
      },
      unknownTeam: null,
      notes: null,
      sourceUrl: null,
      refused: null,
    }
  }

  const { team, kitType, isRetro, notes } = parsed.data
  const season = normaliseSeason(parsed.data.season)
  const matched = matchTeam(team, teams)

  // Our own title whenever a team is named, so the catalogue reads the same
  // from end to end; the model's own wording only when it named no team.
  const title = composeTitle(team, kitType, season) ?? parsed.data.title

  const refusedTitle = forbiddenWord(title)
  const refusedDescription = forbiddenWord(parsed.data.description)

  return {
    fields: {
      title: refusedTitle ? null : title,
      description: refusedDescription ? null : parsed.data.description,
      season,
      kitType,
      teamId: matched?.id ?? null,
      isRetro: isRetro === true,
    },
    unknownTeam: team && !matched ? team : null,
    notes,
    sourceUrl: httpUrl(parsed.data.sourceUrl),
    refused: refusedTitle ?? refusedDescription,
  }
}
