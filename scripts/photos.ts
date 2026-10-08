/**
 * Prépare les photos de maillots pour le catalogue.
 *
 *   npm run photos                       # liste ce qui serait fait, et le coût
 *   npm run photos -- --go               # traite tout ce qui reste
 *   npm run photos -- --go aston fulham  # seulement les noms qui contiennent ça
 *
 * Lit `references/`, écrit `references-pretes/` : fond retiré, recadré au plus
 * près du maillot, carré 1200×1200, transparence conservée.
 *
 * Le détourage coûte 10 unités ImageKit par photo, sur 650 par mois. Le script
 * ne fait donc rien par défaut : il annonce d'abord la facture. Et il saute
 * toute photo déjà présente en sortie, pour qu'une relance ne repaie jamais
 * deux fois la même image.
 */
import { config } from 'dotenv'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, extname, join } from 'node:path'

config({ path: '.env.local', quiet: true })

const INPUT = 'references'
const OUTPUT = 'references-pretes'
const UNITS_PER_PHOTO = 10
/** Recadrage puis mise au carré. Validé contre ImageKit : `e-trim` est ignoré, `t-` fonctionne. */
const FINISH = 't-12:w-1200,h-1200,cm-pad_resize'
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

const go = process.argv.includes('--go')
const keepBackground = process.argv.includes('--garder-fond')
/** Tout argument qui n'est pas une option filtre les noms de fichiers. */
const filters = process.argv.slice(2).filter((arg) => !arg.startsWith('--')).map((f) => f.toLowerCase())

function auth(): string {
  const key = process.env.IMAGEKIT_PRIVATE_KEY
  if (!key) throw new Error('IMAGEKIT_PRIVATE_KEY manque dans .env.local')
  return `Basic ${Buffer.from(`${key}:`).toString('base64')}`
}

function endpoint(): string {
  return (process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? '').replace(/\/+$/, '')
}

/** "WhatsApp Image 2026-10-05 at 19.28.06.jpeg" -> "whatsapp-image-2026-10-05-at-19-28-06" */
function slug(name: string): string {
  return basename(name, extname(name))
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function upload(bytes: Buffer, fileName: string, folder: string) {
  const body = new FormData()
  body.set('file', new Blob([new Uint8Array(bytes)]), fileName)
  body.set('fileName', fileName)
  body.set('folder', folder)
  body.set('useUniqueFileName', 'true')

  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: { Authorization: auth() },
    body,
  })
  if (!response.ok) throw new Error(`upload ${response.status}: ${await response.text()}`)
  return (await response.json()) as { url: string; fileId: string; filePath: string }
}

async function uploadFromUrl(url: string, fileName: string, folder: string) {
  const body = new FormData()
  body.set('file', url)
  body.set('fileName', fileName)
  body.set('folder', folder)
  body.set('useUniqueFileName', 'true')

  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: { Authorization: auth() },
    body,
  })
  if (!response.ok) throw new Error(`upload url ${response.status}: ${await response.text()}`)
  return (await response.json()) as { url: string; fileId: string; filePath: string }
}

async function remove(fileId: string) {
  // Le travail utile est le PNG local ; rien ne doit rester dans la médiathèque.
  await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: auth() },
  }).catch(() => {})
}

async function main() {
  if (!existsSync(INPUT)) throw new Error(`Le dossier ${INPUT}/ n'existe pas.`)
  await mkdir(OUTPUT, { recursive: true })

  const entries = (await readdir(INPUT))
    .filter((name) => EXTENSIONS.has(extname(name).toLowerCase()))
    // "_" en tête = fichier de travail, on l'ignore.
    .filter((name) => !name.startsWith('_'))
    .filter((name) => filters.length === 0 || filters.some((f) => name.toLowerCase().includes(f)))
    .sort()

  const todo = entries.filter((name) => !existsSync(join(OUTPUT, `${slug(name)}.png`)))
  const skipped = entries.length - todo.length

  console.log(`${entries.length} photo(s) retenue(s) dans ${INPUT}/${filters.length ? ` (filtre : ${filters.join(', ')})` : ''}`)
  if (skipped > 0) console.log(`${skipped} déjà prête(s), ignorée(s)`)

  if (todo.length === 0) {
    console.log('Rien à faire.')
    return
  }

  const cost = keepBackground ? 0 : todo.length * UNITS_PER_PHOTO
  console.log(`${todo.length} à traiter — coût : ${cost} unités ImageKit (650 par mois)`)
  for (const name of todo) console.log(`   ${name}  ->  ${OUTPUT}/${slug(name)}.png`)

  if (!go) {
    console.log('\nRien n\'a été fait. Relance avec --go pour traiter.')
    return
  }

  let done = 0
  for (const name of todo) {
    const target = join(OUTPUT, `${slug(name)}.png`)
    const temporary: string[] = []

    try {
      const original = await upload(await readFile(join(INPUT, name)), `${slug(name)}.jpg`, '/dakarkits/travail')
      temporary.push(original.fileId)

      let source = original
      if (!keepBackground) {
        // Une seule passe d'IA, puis on redimensionne un fichier ordinaire :
        // 10 unités par photo, jamais plus.
        source = await uploadFromUrl(
          `${endpoint()}/${original.filePath.replace(/^\/+/, '')}?tr=e-bgremove`,
          `${slug(name)}-nobg.png`,
          '/dakarkits/travail',
        )
        temporary.push(source.fileId)
      }

      const response = await fetch(`${source.url}?tr=${FINISH}`)
      if (!response.ok) throw new Error(`rendu ${response.status}`)
      const png = Buffer.from(await response.arrayBuffer())
      await writeFile(target, png)

      done += 1
      console.log(`   ok  ${name}  (${Math.round(png.length / 1024)} Ko)`)
    } catch (error) {
      console.error(`   ÉCHEC  ${name}`, error instanceof Error ? error.message : error)
    } finally {
      for (const id of temporary) await remove(id)
    }
  }

  console.log(`\n${done}/${todo.length} prête(s) dans ${OUTPUT}/`)
  if (done > 0 && !keepBackground) {
    console.log(
      'Au moment de les envoyer dans l\'admin, DÉCOCHE « Retirer le fond » :\n' +
        'le fond est déjà retiré, le recocher repaierait 10 unités par photo.',
    )
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
