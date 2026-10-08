/**
 * Instant search, small enough to ship to a phone on 4G: no library, no server
 * round trip. Accent- and case-insensitive, forgiving of a dropped or swapped
 * letter, and backed by the per-team aliases so "barca" finds FC Barcelone —
 * which no amount of normalisation would do on its own.
 */

export type Searchable = {
  /** Already normalised at build time: title, team, league, season, aliases. */
  haystack: string
}

/** "Barça 24/25" -> "barca 24/25" */
export function normalise(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function buildHaystack(parts: Array<string | null | undefined>): string {
  return normalise(parts.filter(Boolean).join(' '))
}

/** Damerau-Levenshtein, capped: we only ever care about "is it within 1?". */
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 1) return false

  let i = 0
  let j = 0
  let edits = 0

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++
      j++
      continue
    }
    if (++edits > 1) return false

    if (a.length > b.length) i++
    else if (a.length < b.length) j++
    else {
      // Same length: either a substitution, or two letters swapped.
      if (a[i + 1] === b[j] && a[i] === b[j + 1]) {
        i += 2
        j += 2
        continue
      }
      i++
      j++
    }
  }

  return edits + (a.length - i) + (b.length - j) <= 1
}

function tokenMatches(token: string, words: string[]): boolean {
  for (const word of words) {
    if (word.startsWith(token)) return true
    // A typo is only worth forgiving once the word is long enough that a single
    // wrong letter can't turn it into a different jersey.
    if (token.length >= 4 && withinOneEdit(token, word.slice(0, token.length + 1))) return true
    if (token.length >= 4 && withinOneEdit(token, word)) return true
  }
  return false
}

/** Every typed word must match something. Returns the matching items, in order. */
export function searchItems<T extends Searchable>(items: T[], query: string): T[] {
  const tokens = normalise(query).split(' ').filter(Boolean)
  if (tokens.length === 0) return []

  return items.filter((item) => {
    const words = item.haystack.split(' ')
    return tokens.every((token) => tokenMatches(token, words))
  })
}
