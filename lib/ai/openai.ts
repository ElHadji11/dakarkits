import 'server-only'

import { currentSeason } from '@/lib/ai/suggest'

/**
 * One `fetch` against the OpenAI Responses API, no SDK — the same choice as
 * ImageKit, Resend and Telegram. The provider lives behind this single
 * function, so swapping it later touches this file and nothing else.
 *
 * The Responses endpoint rather than chat completions, because it is the one
 * that hosts the `web_search` tool. That tool is the point: from memory alone
 * the model invents seasons for kits released after its training, which is
 * exactly the catalogue we are entering.
 */

const ENDPOINT = 'https://api.openai.com/v1/responses'

/**
 * Override with OPENAI_MODEL. Whatever goes here has to read an image and
 * support the hosted `web_search` tool.
 */
const DEFAULT_MODEL = 'gpt-5.6-luna'

/** Three photos is plenty: front, back, detail. More only costs tokens. */
export const MAX_PHOTOS = 3

/** Searching takes its time: ten seconds is normal, thirty happens. */
const TIMEOUT_MS = 90_000

/** Reasoning, the searches and the answer all draw on this budget. */
const MAX_OUTPUT_TOKENS = 3000

export function isConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}

/** A failure the admin can read: a refused model, an exhausted quota. */
export class ProviderError extends Error {}

/**
 * The model sees the jersey we actually have in stock, photographed flat.
 *
 * The order of the three steps is the whole design: describe first, search
 * second, conclude third. Asked for a season straight away it answers from
 * memory, and memory stops at its training — it then fabricates a plausible
 * season for a kit it has never seen. Told to look first, it answers from a
 * page or it answers null.
 */
function systemPrompt(now: Date): string {
  return `Tu remplis la fiche produit d'une petite boutique de maillots de football à Dakar.
On te donne une ou plusieurs photos d'un maillot réellement en stock, posé à plat, suspendu ou porté.

Nous sommes le ${now.toISOString().slice(0, 10)}. La saison en cours est ${currentSeason(now)}.

Procède dans cet ordre, sans sauter d'étape :
1. Décris ce que tu vois : couleurs, motif, col, manches, écusson, sponsor maillot, toute inscription lisible.
2. Cherche sur le web à partir de cette description — le club, le sponsor, le motif, la saison. Fais plusieurs recherches si la première ne tranche pas, et pense aux saisons récentes, ${currentSeason(now)} comprise.
3. Conclus à partir des pages trouvées, pas de ta mémoire.

Règles absolues :
- La saison ne sort que d'une page que tu as réellement consultée, ou d'une date imprimée sur le maillot. Si tes recherches ne la confirment pas, réponds null et dis-le dans « notes ». Ne déduis jamais une saison de ta seule mémoire : les maillots récents sont postérieurs à ton entraînement, et tu inventerais.
- Mets dans « sourceUrl » l'adresse de la page qui établit la saison. Pas de saison sans page, sauf date lue sur le maillot — écris alors « date imprimée » dans « notes ».
- Ce sont des répliques. N'écris jamais « officiel », « authentique », « original », « véritable », « sous licence », ni aucun équivalent.
- Ne nomme jamais l'équipementier (Nike, adidas, Puma, et les autres), ni dans le titre ni dans la description, même si son logo est sur la photo et même si les pages trouvées le nomment. Le sponsor maillot, lui, peut être nommé.
- La description ne décrit que ce que montre la photo. Les recherches servent à identifier, pas à enrichir : n'ajoute aucun détail de matière ou de technologie que tu ne vois pas.
- Le titre ne commence jamais par « Maillot » : la boutique ne vend que ça. Il commence par le club ou la sélection.
- Un seul format de titre : « Équipe · Domicile 2024/25 » — point médian, type de maillot en français avec une majuscule, saison à la fin. Omets ce que tu ne sais pas plutôt que d'inventer : « Équipe · Domicile » et « Équipe » seuls sont corrects.
- Pas de prix, pas de taille, pas de promesse de livraison, pas de superlatif publicitaire.
- Français, phrases neutres, trois phrases courtes au maximum pour la description.`
}

const USER_PROMPT =
  'Voici les photos du maillot. Décris-le, cherche, puis remplis la fiche. Mets null partout où tu ne peux pas conclure.'

/** Nullable everywhere, no enum: Zod does the narrowing on the way back. */
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['team', 'kitType', 'season', 'isRetro', 'title', 'description', 'notes', 'sourceUrl'],
  properties: {
    team: { type: ['string', 'null'], description: "Nom courant de l'équipe : Sénégal, FC Barcelone" },
    kitType: { type: ['string', 'null'], description: 'home, away ou third' },
    season: { type: ['string', 'null'], description: '2024/25, seulement si une page le confirme' },
    isRetro: { type: ['boolean', 'null'], description: 'true si maillot visiblement ancien' },
    title: { type: ['string', 'null'], description: "seulement si l'équipe n'a pas été identifiée" },
    description: { type: ['string', 'null'], description: 'ce que la photo montre' },
    notes: { type: ['string', 'null'], description: 'ta réserve, en une ligne' },
    sourceUrl: { type: ['string', 'null'], description: 'la page qui établit la saison' },
  },
} as const

type ResponsesPayload = {
  status?: string
  output_text?: string
  output?: Array<{
    type: string
    content?: Array<{ type?: string; text?: string }>
  }>
  incomplete_details?: { reason?: string }
}

/** The assistant message, which the schema guarantees is our JSON object. */
function answerOf(payload: ResponsesPayload): string | null {
  if (payload.output_text) return payload.output_text

  for (const item of payload.output ?? []) {
    if (item.type !== 'message') continue
    const text = item.content?.find((part) => typeof part.text === 'string')?.text
    if (text) return text
  }
  return null
}

/**
 * Returns the parsed JSON object the model answered with. Throws on a network
 * failure, a refused key, a quota, or an answer that is not JSON — the caller
 * turns that into a message for the admin.
 */
export async function askForProductFields(imageUrls: string[], now = new Date()): Promise<unknown> {
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
      instructions: systemPrompt(now),
      tools: [{ type: 'web_search' }],
      max_output_tokens: MAX_OUTPUT_TOKENS,
      text: { format: { type: 'json_schema', name: 'product_fields', schema: SCHEMA, strict: true } },
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: USER_PROMPT },
            ...imageUrls.slice(0, MAX_PHOTOS).map((url) => ({
              type: 'input_image' as const,
              image_url: url,
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

  const payload = JSON.parse(body) as ResponsesPayload
  const answer = answerOf(payload)

  if (!answer) {
    throw new ProviderError(
      payload.incomplete_details?.reason === 'max_output_tokens'
        ? `Le modèle a épuisé son budget de tokens en cherchant (${model}).`
        : `Le modèle a répondu à vide (${model}).`,
    )
  }

  return JSON.parse(answer)
}
