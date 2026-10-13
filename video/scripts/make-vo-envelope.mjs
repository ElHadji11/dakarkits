/**
 * Les enveloppes des voix off : une valeur par frame, calculees une fois.
 *
 *   node scripts/make-vo-envelope.mjs
 *
 * La bouche de la mascotte s'ouvre sur le son. Il faudrait donc lire le
 * niveau du fichier audio pendant le rendu — sauf qu'un rendu Remotion doit
 * etre **deterministe** : la frame 42 doit sortir identique qu'on la calcule
 * seule, en lot, ou sur une autre machine. Analyser un flux audio au rendu
 * depend du decodeur, du navigateur et de l'ordre des frames ; deux rendus
 * donneraient deux bouches.
 *
 * Alors l'analyse se fait ici, a froid, et le film ne lit qu'un tableau de
 * nombres. C'est le meme choix que `geometry.ts` et `assets.ts` : ce qui peut
 * etre su avant le rendu est su avant le rendu.
 *
 * **Le script balaie `public/audio/vo-*.mp3`**, un fichier par accroche. Il
 * y en a trois depuis que l'accroche est devenue un parametre du film
 * (`src/reel/hooks/`) : le lion, le choc du prix, et la variante marche.
 * Chacune a sa phrase, donc sa voix, donc son enveloppe — et elles n'ont pas
 * la meme duree, ce dont `ReelAudio` a besoin pour creuser le lit musical au
 * bon endroit.
 *
 * `ffmpeg` est celui de Remotion, deja installe — pas de dependance de plus.
 */
import { execFileSync } from 'node:child_process'
import {
  closeSync,
  existsSync,
  ftruncateSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeSync,
} from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const DIR = resolve(ROOT, 'public/audio')
const OUT = resolve(ROOT, 'src/reel/vo-envelope.ts')

const FPS = 30
/** Assez pour suivre une syllabe, assez peu pour que le tableau reste court. */
const RATE = 16000

const files = readdirSync(DIR)
  .filter((f) => /^vo-.+\.mp3$/.test(f))
  .sort()

if (files.length === 0) {
  console.error('aucune voix off trouvee dans ' + DIR)
  process.exit(1)
}

/** L'enveloppe d'un fichier : une valeur par frame, normalisee. */
const envelopeOf = (file) => {
  /*
   * On passe par un WAV temporaire, et non par la sortie standard.
   *
   * Le ffmpeg livre avec Remotion est compile avec `--disable-muxers` et une
   * courte liste d'exceptions : le format brut `s16le` n'en fait pas partie,
   * et la commande echoue sur « Requested output format is not known ». Le
   * `wav`, lui, est present, et l'encodeur `pcm_s16le` aussi — un WAV, c'est
   * justement du PCM brut avec un en-tete de quarante-quatre octets.
   */
  const TMP = resolve(tmpdir(), 'dakarkits-vo-' + process.pid + '-' + file + '.wav')
  execFileSync(
    'npx',
    [
      'remotion',
      'ffmpeg',
      '-y',
      '-i',
      resolve(DIR, file),
      '-acodec',
      'pcm_s16le',
      '-ac',
      '1',
      '-ar',
      String(RATE),
      '-loglevel',
      'error',
      TMP,
    ],
    { cwd: ROOT, maxBuffer: 1 << 28, shell: true },
  )

  const wav = readFileSync(TMP)
  rmSync(TMP, { force: true })

  /*
   * Le bloc `data` n'est pas toujours a l'octet 44 : ffmpeg ecrit un `LIST`
   * d'etiquettes avant lui. On saute donc de bloc en bloc jusqu'a le trouver,
   * plutot que de supposer un decalage.
   */
  let pos = 12
  while (pos + 8 <= wav.length && wav.toString('ascii', pos, pos + 4) !== 'data') {
    pos += 8 + wav.readUInt32LE(pos + 4)
  }
  const start = pos + 8
  const size = pos + 8 <= wav.length ? wav.readUInt32LE(pos + 4) : 0
  const samples = new Int16Array(
    wav.buffer,
    wav.byteOffset + start,
    Math.floor(Math.min(size, wav.length - start) / 2),
  )
  const perFrame = RATE / FPS
  const frames = Math.ceil(samples.length / perFrame)

  /*
   * La valeur par frame est une moyenne quadratique, pas un maximum : un pic
   * isole — un claquement de langue, un souffle — ouvrirait la bouche en
   * grand sur une seule frame, ce qui se voit comme un sursaut. La moyenne
   * suit l'energie de la syllabe.
   */
  const raw = new Array(frames)
  for (let f = 0; f < frames; f++) {
    const from = Math.floor(f * perFrame)
    const to = Math.min(samples.length, Math.floor((f + 1) * perFrame))
    let sum = 0
    for (let i = from; i < to; i++) {
      const v = samples[i] / 32768
      sum += v * v
    }
    raw[f] = Math.sqrt(sum / Math.max(1, to - from))
  }

  /*
   * Normalisation sur le 95e centile, pas sur le maximum : une seule frame
   * plus forte que les autres ecraserait tout le reste vers le bas et la
   * bouche resterait entrouverte pendant douze secondes.
   */
  const sorted = [...raw].sort((a, b) => a - b)
  const peak = sorted[Math.floor(sorted.length * 0.95)] || 1
  const norm = raw.map((v) => Math.min(1, v / peak))

  /*
   * Un lissage asymetrique : la bouche s'ouvre vite et se ferme lentement.
   *
   * C'est ainsi qu'une machoire bouge — elle tombe d'un coup sur l'attaque de
   * la syllabe et remonte en trainant. Lisser pareil dans les deux sens donne
   * une bouche en caoutchouc, toujours en retard sur le son.
   */
  const ATTACK = 0.65
  const RELEASE = 0.22
  const env = []
  let cur = 0
  for (const v of norm) {
    cur += (v - cur) * (v > cur ? ATTACK : RELEASE)
    env.push(+cur.toFixed(3))
  }
  return env
}

const made = files.map((file) => {
  const name = file.replace(/^vo-/, '').replace(/\.mp3$/, '')
  const env = envelopeOf(file)
  console.log(
    '  ' + file + ' : ' + env.length + ' frames (' + (env.length / FPS).toFixed(2) + ' s)',
  )
  return { name, file, env }
})

const body = [
  '/** Genere par `npm run vo` — ne pas editer a la main. */',
  '',
  '/**',
  ' * Les enveloppes des voix off, une valeur par frame a ' + FPS + ' fps.',
  ' *',
  ' * 0 = silence, 1 = la syllabe la plus forte. La bouche de la mascotte lit',
  ' * ce tableau et rien d’autre : le rendu reste deterministe, et refaire la',
  ' * voix off suffit a refaire l’animation.',
  ' *',
  ' * Une entree par fichier `public/audio/vo-*.mp3`, c’est-a-dire une par',
  ' * accroche. `frames` sert aussi a `ReelAudio`, qui creuse le lit musical',
  ' * exactement sur la duree de la voix et pas une frame de plus.',
  ' */',
  'export const VO = {',
  ...made.map(
    ({ name, file, env }) =>
      '  ' +
      JSON.stringify(name) +
      ': { file: ' +
      JSON.stringify('audio/' + file) +
      ', frames: ' +
      env.length +
      ', env: [' +
      env.join(', ') +
      '] },',
  ),
  '} as const',
  '',
  'export type VoName = keyof typeof VO',
  '',
].join('\n')

// Meme precaution que dans `capture.mjs` : `writeFile` ouvre en `CREATE_ALWAYS`,
// que certaines machines Windows refusent sur un fichier deja suivi par git.
if (existsSync(OUT)) {
  const data = Buffer.from(body, 'utf8')
  const fd = openSync(OUT, 'r+')
  try {
    ftruncateSync(fd, 0)
    writeSync(fd, data, 0, data.length, 0)
  } finally {
    closeSync(fd)
  }
} else {
  await writeFile(OUT, body)
}

console.log(made.length + ' enveloppe(s) -> src/reel/vo-envelope.ts')
