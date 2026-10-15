import 'server-only'

import { createHmac, randomUUID } from 'node:crypto'

const UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload'

export type UploadedFile = {
  url: string
  fileId: string
  filePath: string
}

export function urlEndpoint(): string {
  return (process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? '').replace(/\/+$/, '')
}

/** False until the three ImageKit variables are filled in. */
export function isConfigured(): boolean {
  return Boolean(
    process.env.IMAGEKIT_PRIVATE_KEY &&
      process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY &&
      urlEndpoint(),
  )
}

/** Only accept URLs the browser claims to have uploaded if they are really ours. */
export function isOwnUrl(url: string): boolean {
  const endpoint = urlEndpoint()
  return endpoint.length > 0 && url.startsWith(`${endpoint}/`)
}

const BLUR_TRANSFORM = 'w-20,bl-10,q-50,f-webp'
const BLUR_MAX_BYTES = 4096
const BLUR_TIMEOUT_MS = 2000

/**
 * La vignette floue d'une photo, en data URI, pour `placeholder="blur"`.
 *
 * Next fabrique ce `blurDataURL` tout seul pour un import statique, jamais
 * pour une URL distante servie par un loader maison (`lib/image-loader.ts`) :
 * il faut donc le lui donner. ImageKit la produit (`w-20,bl-10`) et on
 * l'inline — quelques centaines d'octets qui voyagent avec la fiche, plutôt
 * qu'une requête de plus sur la 4G qui est déjà le goulot. `f-webp` et non
 * `f-jpg` : nos photos sont détourées, et un JPEG leur collerait un fond.
 *
 * Appelée depuis `getProduct`, donc derrière `'use cache'` : la vignette est
 * cherchée au remplissage du cache, pas à chaque visite.
 *
 * `null` à la moindre contrariété — une URL qui n'est pas la nôtre (jamais de
 * `fetch` vers une adresse venue de la base sans ce garde), ImageKit qui ne
 * répond pas, une vignette anormalement grosse. Une fiche sans flou reste une
 * fiche ; une fiche qui ne se rend pas parce que la vignette a échoué, non.
 * Chercher `[blur]` dans les logs si le flou disparaît partout à la fois.
 */
export async function blurDataUrl(url: string): Promise<string | null> {
  if (!isOwnUrl(url)) return null

  const [base] = url.split('?')
  try {
    const response = await fetch(`${base}?tr=${BLUR_TRANSFORM}`, {
      signal: AbortSignal.timeout(BLUR_TIMEOUT_MS),
    })
    if (!response.ok) return null

    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.byteLength === 0 || bytes.byteLength > BLUR_MAX_BYTES) return null

    return `data:image/webp;base64,${bytes.toString('base64')}`
  } catch {
    console.warn('[blur] vignette indisponible', url)
    return null
  }
}

/**
 * Short-lived credentials so the phone uploads straight to ImageKit. Several
 * photos would blow past the Server Action body limit, and routing megabytes
 * through Vercel on a 4G connection would be slower for no gain.
 */
export function uploadAuthParams(): { token: string; expire: number; signature: string } {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  if (!privateKey) throw new Error('IMAGEKIT_PRIVATE_KEY is missing.')

  const token = randomUUID()
  const expire = Math.floor(Date.now() / 1000) + 60 * 10
  const signature = createHmac('sha1', privateKey).update(token + expire).digest('hex')

  return { token, expire, signature }
}

function basicAuth(): string {
  return `Basic ${Buffer.from(`${process.env.IMAGEKIT_PRIVATE_KEY}:`).toString('base64')}`
}

/** Server-side upload. `file` may be raw base64 or a URL ImageKit will fetch. */
async function upload(file: string, fileName: string, folder: string): Promise<UploadedFile> {
  const body = new FormData()
  body.set('file', file)
  body.set('fileName', fileName)
  body.set('folder', folder)
  body.set('useUniqueFileName', 'true')

  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: { Authorization: basicAuth() },
    body,
  })

  if (!response.ok) {
    throw new Error(`ImageKit upload failed (${response.status}): ${await response.text()}`)
  }

  const json = (await response.json()) as { url: string; fileId: string; filePath: string }
  return { url: json.url, fileId: json.fileId, filePath: json.filePath }
}

/**
 * Bakes the cut-out once and stores it as its own file.
 *
 * ImageKit caches AI output per full URL, so serving `tr=w-400,e-bgremove` and
 * `tr=w-800,e-bgremove` would spend 10 extension units *each*, emptying the 650
 * free monthly units in about thirteen jerseys. Applying `e-bgremove` alone,
 * re-uploading the result, and resizing that plain file instead costs exactly
 * 10 units per photo. The original is never touched.
 *
 * Returns null when the transform or the re-upload fails — a spent quota must
 * degrade to the original photo, not to an error.
 */
export async function bakeBackgroundRemoved(
  originalFilePath: string,
): Promise<UploadedFile | null> {
  try {
    const source = `${urlEndpoint()}/${originalFilePath.replace(/^\/+/, '')}?tr=e-bgremove`
    const name = `${originalFilePath.split('/').pop()?.replace(/\.[^.]+$/, '') ?? 'photo'}-nobg.png`
    return await upload(source, name, '/dakarkits/products')
  } catch (error) {
    console.error('[imagekit] background removal failed, keeping the original', error)
    return null
  }
}
