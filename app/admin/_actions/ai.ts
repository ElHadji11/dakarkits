'use server'

import { askForProductFields, isConfigured, MAX_PHOTOS, ProviderError } from '@/lib/ai/openai'
import { buildSuggestion, type Suggestion } from '@/lib/ai/suggest'
import { requireAdmin } from '@/lib/auth/session'
import { listTeams } from '@/lib/catalog'
import { isOwnUrl } from '@/lib/imagekit'
import { consume } from '@/lib/rate-limit'

export type SuggestResult = { ok: true; suggestion: Suggestion } | { ok: false; error: string }

/**
 * Sixty calls an hour. Building a whole catalogue in one sitting fits; a stuck
 * button hammering the endpoint does not.
 */
const LIMIT = 60
const WINDOW_SECONDS = 3600

/**
 * Reads the photos already uploaded for a product and proposes the text fields.
 * Never the price, never the sizes, never the status: those are decisions, not
 * transcription. Nothing is written to the database — the answer goes back to
 * the open form, which the admin still has to check and submit.
 */
export async function suggestProductFields(imageUrls: string[]): Promise<SuggestResult> {
  const admin = await requireAdmin()

  if (!isConfigured()) {
    return { ok: false, error: "La clé OpenAI n'est pas configurée sur le serveur." }
  }

  // Only our own ImageKit files. Without this the form would happily make the
  // server fetch any URL a caller hands it.
  const urls = imageUrls.filter((url) => typeof url === 'string' && isOwnUrl(url))
  if (urls.length === 0) {
    return { ok: false, error: "Ajoute d'abord une photo du maillot." }
  }

  const { ok, retryAfter } = await consume(`ai:suggest:${admin.id}`, LIMIT, WINDOW_SECONDS)
  if (!ok) {
    const minutes = Math.max(1, Math.ceil(retryAfter / 60))
    return { ok: false, error: `Trop de propositions d'affilée. Réessaie dans ${minutes} minute(s).` }
  }

  let raw: unknown
  try {
    raw = await askForProductFields(urls.slice(0, MAX_PHOTOS))
  } catch (error) {
    console.error('[ai] suggestProductFields', error)
    return {
      ok: false,
      // A refused model name or an exhausted quota says so; anything else — a
      // timeout, a socket, a malformed answer — is just "try again".
      error:
        error instanceof ProviderError
          ? error.message
          : "L'IA n'a pas répondu. Réessaie dans un instant.",
    }
  }

  const teams = await listTeams()
  return { ok: true, suggestion: buildSuggestion(raw, teams) }
}
