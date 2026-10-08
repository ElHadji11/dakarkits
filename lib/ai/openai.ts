import 'server-only'

/**
 * One `fetch` against the OpenAI chat API, no SDK — the same choice as
 * ImageKit, Resend and Telegram. The provider lives behind this single
 * function, so swapping it later touches this file and nothing else.
 */

const ENDPOINT = 'https://api.openai.com/v1/chat/completions'

/**
 * Override with OPENAI_MODEL. Whatever goes here has to read an image: a
 * text-only model answers the request with a 400 and the fields stay empty.
 */
const DEFAULT_MODEL = 'gpt-5.6-luna'

/** Three photos is plenty: front, back, detail. More only costs tokens. */
export const MAX_PHOTOS = 3

const TIMEOUT_MS = 45_000

export function isConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}

/** A failure the admin can read: a refused model, an exhausted quota. */
export class ProviderError extends Error {}

/**
 * The model sees the jersey we actually have in stock, photographed flat, and
 * nothing else. Hence the two standing orders: describe only what is visible,
 * and answer null rather than guess — a wrong value the admin has to spot and
 * undo is worse than an empty field they simply fill in.
 */
const SYSTEM_PROMPT = `Tu remplis la fiche produit d'une petite boutique de maillots de football à Dakar.
On te donne une ou plusieurs photos d'un maillot réellement en stock, posé à plat, suspendu ou porté.

Règles absolues :
- Ce sont des répliques. N'écris jamais « officiel », « authentique », « original », « véritable », « sous licence », ni aucun équivalent.
- Ne nomme jamais l'équipementier (Nike, adidas, Puma, et les autres), même si son logo est visible sur la photo.
- Ne décris que ce qui est visible. N'invente aucun sponsor, aucun flocage, aucune matière, aucune technologie, aucun détail de col ou de manche.
- Si un champ n'est pas déterminable, réponds null. Un null vaut toujours mieux qu'une supposition.
- La saison : si tu reconnais le maillot à son design, son sponsor, son motif ou son col, donne la saison correspondante, même sans date imprimée. C'est une information utile et elle sera relue avant publication. Écris alors dans « notes » que la saison vient de la reconnaissance du modèle et non d'une date lue sur le maillot. Ne réponds null que si tu n'as vraiment aucune idée, ou si plus de deux saisons sont possibles.
- Le titre ne commence jamais par « Maillot » : la boutique ne vend que ça. Il commence par le club ou la sélection.
- Pas de prix, pas de taille, pas de promesse de livraison, pas de superlatif publicitaire.
- Français, vouvoiement ou phrases neutres, trois phrases courtes au maximum pour la description.

Réponds uniquement en JSON, avec exactement ces clés :
{
  "team": string|null,        // le nom de l'équipe tel qu'on le dit couramment : "Sénégal", "FC Barcelone", "Real Madrid"
  "kitType": "home"|"away"|"third"|null,  // domicile, extérieur, third
  "season": string|null,      // "2024/25" seulement si une date est imprimée sur le maillot
  "isRetro": boolean|null,    // true si c'est visiblement un maillot ancien, rétro
  "title": string|null,       // utilisé seulement si tu n'as pas identifié l'équipe ; jamais préfixé par « Maillot »
  "description": string|null, // couleurs, col, manches, motif : ce que la photo montre
  "notes": string|null        // ta réserve, en six mots maximum : "écusson illisible"
}`

const USER_PROMPT =
  'Voici les photos du maillot. Remplis la fiche en JSON, et mets null partout où la photo ne te permet pas de répondre.'

/**
 * Returns the parsed JSON object the model answered with. Throws on a network
 * failure, a refused key, a quota, or an answer that is not JSON — the caller
 * turns that into a message for the admin.
 */
export async function askForProductFields(imageUrls: string[]): Promise<unknown> {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY is missing.')

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({
      model,
      // Accepted by every current model family, where `max_tokens` is not.
      // Kept wide: on a model that thinks before answering, the reasoning is
      // billed against this budget, and a budget spent thinking returns an
      // empty answer.
      max_completion_tokens: 2000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: USER_PROMPT },
            ...imageUrls.slice(0, MAX_PHOTOS).map((url) => ({
              type: 'image_url' as const,
              image_url: { url },
            })),
          ],
        },
      ],
    }),
  })

  const body = await response.text()

  if (!response.ok) {
    // The provider's own wording, passed through: a wrong model name or an
    // exhausted quota is something the admin can act on, and this screen is
    // only ever seen by the admin.
    let detail = body.slice(0, 300)
    try {
      detail = (JSON.parse(body) as { error?: { message?: string } }).error?.message ?? detail
    } catch {
      // Not JSON; the raw excerpt is what we have.
    }
    throw new ProviderError(`OpenAI ${response.status} : ${detail}`)
  }

  const payload = JSON.parse(body) as {
    choices?: Array<{ message?: { content?: string | null }; finish_reason?: string }>
  }
  const choice = payload.choices?.[0]
  const content = choice?.message?.content

  if (!content) {
    throw new ProviderError(
      choice?.finish_reason === 'length'
        ? `Le modèle a épuisé son budget de tokens sans répondre (${model}).`
        : `Le modèle a répondu à vide (${model}).`,
    )
  }

  return JSON.parse(content)
}
