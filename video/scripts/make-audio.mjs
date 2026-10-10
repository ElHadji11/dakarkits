/**
 * Fabrique la bande-son du spot, échantillon par échantillon.
 *
 * Aucune banque musicale : chaque son est synthétisé ici, donc libre de
 * droits. C'est ce qui protège le compte publicitaire — un morceau du commerce
 * posé sur une vidéo de vêtements se fait repérer automatiquement.
 *
 * Le beat est amapiano (log drum glissant, shaker en doubles-croches, nappe
 * mineure) mais ses percussions sont des frappes sabar : le tak sec du bâton
 * et le gin ouvert de la main. C'est ce qui ancre le spot à Dakar.
 *
 * Tout est calé sur 120 BPM, soit 15 frames par temps à 30 fps : chaque coupe
 * du montage tombe sur un temps fort. Voir `CUTS` dans `src/theme.ts`.
 *
 *   node scripts/make-audio.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SR = 44100
const BPM = 120
const BEAT = 60 / BPM
const BAR = BEAT * 4
const DURATION = 15
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio')

/* ------------------------------------------------------------------ outils */

/** PRNG déterministe : relancer le script doit redonner le même fichier. */
const mulberry32 = (seed) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
let rnd = mulberry32(1337)
const noise = () => rnd() * 2 - 1

const buffer = (seconds) => new Float32Array(Math.ceil(seconds * SR))

/** Mixe `src` dans `dst` à `at` secondes. */
const place = (dst, src, at, gain = 1) => {
  const start = Math.round(at * SR)
  for (let i = 0; i < src.length; i++) {
    const j = start + i
    if (j >= 0 && j < dst.length) dst[j] += src[i] * gain
  }
}

/** Enveloppe percussive : attaque quasi nulle, décroissance exponentielle. */
const decay = (t, tau, attack = 0.002) =>
  Math.min(1, t / attack) * Math.exp(-t / tau)

/** Biquad RBJ. Un seul passage, suffisant pour des percussions. */
const biquad = (input, type, freq, q) => {
  const w = (2 * Math.PI * freq) / SR
  const cw = Math.cos(w)
  const sw = Math.sin(w)
  const alpha = sw / (2 * q)
  let b0, b1, b2
  const a0 = 1 + alpha
  const a1 = -2 * cw
  const a2 = 1 - alpha
  if (type === 'lp') {
    b0 = (1 - cw) / 2
    b1 = 1 - cw
    b2 = (1 - cw) / 2
  } else if (type === 'hp') {
    b0 = (1 + cw) / 2
    b1 = -(1 + cw)
    b2 = (1 + cw) / 2
  } else {
    b0 = alpha
    b1 = 0
    b2 = -alpha
  }
  const out = new Float32Array(input.length)
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0
  for (let i = 0; i < input.length; i++) {
    const x0 = input[i]
    const y0 = (b0 / a0) * x0 + (b1 / a0) * x1 + (b2 / a0) * x2 - (a1 / a0) * y1 - (a2 / a0) * y2
    out[i] = y0
    x2 = x1; x1 = x0
    y2 = y1; y1 = y0
  }
  return out
}

/**
 * Réverbération de Schroeder : quatre peignes en parallèle, deux passe-tout
 * en série. Sans elle les frappes sabar sonnent comme des clics de souris.
 */
const reverb = (input, mix = 0.22) => {
  const combs = [1687, 1601, 2053, 2251]
  const out = new Float32Array(input.length)
  for (const size of combs) {
    const line = new Float32Array(size)
    let idx = 0
    for (let i = 0; i < input.length; i++) {
      const read = line[idx]
      out[i] += read * 0.25
      line[idx] = input[i] + read * 0.76
      idx = (idx + 1) % size
    }
  }
  for (const size of [389, 157]) {
    const line = new Float32Array(size)
    let idx = 0
    for (let i = 0; i < out.length; i++) {
      const read = line[idx]
      const y = -out[i] + read
      line[idx] = out[i] + read * 0.5
      out[i] = y
      idx = (idx + 1) % size
    }
  }
  const wet = biquad(out, 'lp', 4200, 0.7)
  const res = new Float32Array(input.length)
  for (let i = 0; i < input.length; i++) res[i] = input[i] + wet[i] * mix
  return res
}

/* ------------------------------------------------------------ instruments */

/** Kick amapiano : chute de hauteur rapide, corps rond, pas de claquement. */
const kick = () => {
  const b = buffer(0.3)
  let phase = 0
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const f = 42 + 108 * Math.exp(-t / 0.028)
    phase += (2 * Math.PI * f) / SR
    b[i] = Math.sin(phase) * decay(t, 0.085, 0.001)
  }
  return b
}

/**
 * Le log drum : la signature de l'amapiano. Une sinusoïde qui glisse vers le
 * grave en moins d'un dixième de seconde, saturée pour lui donner du corps.
 * C'est lui qui fait la basse du morceau — il n'y a pas d'autre ligne grave.
 */
const logDrum = (root) => {
  const b = buffer(0.34)
  let phase = 0
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const f = root + root * 1.6 * Math.exp(-t / 0.035)
    phase += (2 * Math.PI * f) / SR
    b[i] = Math.tanh(Math.sin(phase) * 1.9) * decay(t, 0.1, 0.0015)
  }
  return b
}

/** Sabar — le tak : bâton sur la peau tendue. Sec, aigu, très court. */
const sabarTak = (bright = 1) => {
  const raw = buffer(0.1)
  for (let i = 0; i < raw.length; i++) {
    const t = i / SR
    raw[i] = noise() * decay(t, 0.009, 0.0004)
  }
  const body = biquad(raw, 'bp', 2100 * bright, 1.6)
  let phase = 0
  for (let i = 0; i < body.length; i++) {
    const t = i / SR
    phase += (2 * Math.PI * 860) / SR
    body[i] += Math.sin(phase) * decay(t, 0.012, 0.0003) * 0.35
  }
  return body
}

/** Sabar — le gin : frappe ouverte de la main, tonique et plus grave. */
const sabarGin = () => {
  const b = buffer(0.3)
  let p1 = 0
  let p2 = 0
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const bend = Math.exp(-t / 0.05)
    p1 += (2 * Math.PI * (186 + 40 * bend)) / SR
    p2 += (2 * Math.PI * (284 + 60 * bend)) / SR
    b[i] =
      (Math.sin(p1) + Math.sin(p2) * 0.45) * decay(t, 0.075, 0.001) +
      noise() * decay(t, 0.012, 0.0005) * 0.3
  }
  return biquad(b, 'lp', 3200, 0.8)
}

const shaker = () => {
  const raw = buffer(0.07)
  for (let i = 0; i < raw.length; i++) {
    const t = i / SR
    raw[i] = noise() * decay(t, 0.009, 0.001)
  }
  return biquad(raw, 'hp', 6800, 0.8)
}

/** Nappe : quatre voix légèrement désaccordées, attaque lente, très filtrée. */
const pad = (freqs, dur) => {
  const b = buffer(dur + 0.6)
  for (const f of freqs) {
    for (const det of [-0.4, 0.4]) {
      let phase = 0
      for (let i = 0; i < b.length; i++) {
        const t = i / SR
        phase += (2 * Math.PI * (f + det)) / SR
        const env =
          Math.min(1, t / 0.35) * Math.min(1, Math.max(0, (dur + 0.5 - t) / 0.5))
        b[i] += (Math.sin(phase) + Math.sin(phase * 2) * 0.18) * env * 0.09
      }
    }
  }
  return biquad(b, 'lp', 1500, 0.7)
}

/* ---------------------------------------------------------------- musique */

const buildMusic = () => {
  rnd = mulberry32(20261010)
  const left = buffer(DURATION)
  const right = buffer(DURATION)
  const perc = buffer(DURATION)

  const both = (src, at, gain, pan = 0) => {
    place(left, src, at, gain * (1 - Math.max(0, pan)))
    place(right, src, at, gain * (1 + Math.min(0, pan)))
  }

  const kickS = kick()
  const ginS = sabarGin()
  const shakerS = shaker()

  // Am7 puis Fmaj7 : deux accords, c'est assez pour quinze secondes.
  const chords = [
    [220, 261.63, 329.63, 392.0],
    [174.61, 220, 261.63, 329.63],
  ]
  for (let bar = 0; bar < 8; bar += 2) {
    const p = pad(chords[(bar / 2) % 2], BAR * 2)
    place(left, p, bar * BAR, 0.5)
    place(right, p, bar * BAR + 0.012, 0.5)
  }

  const SIXTEENTH = BEAT / 4

  for (let bar = 0; bar < 8; bar++) {
    const barAt = bar * BAR
    if (barAt >= DURATION) break
    // Le premier plan respire : la rythmique complète n'entre qu'à la coupe
    // suivante, sur « +20 maillots ».
    const intro = bar === 0
    const tail = bar >= 7

    for (let s = 0; s < 16; s++) {
      const at = barAt + s * SIXTEENTH
      if (at >= DURATION) break

      // Kick sur 1 et 3, plus un contretemps en fin de mesure.
      if (s === 0 || s === 8 || (!intro && !tail && s === 14 && bar % 2 === 1)) {
        both(kickS, at, 0.95)
      }

      // Log drum : le motif syncopé qui fait tout le genre.
      if (!intro && !tail && [6, 10, 11, 14].includes(s)) {
        const root = s === 11 ? 58.27 : 55
        both(logDrum(root), at, s === 11 ? 0.5 : 0.72)
      }

      // Sabar : le tak porte la trame, le gin marque les appuis.
      if (!tail) {
        const takPattern = intro ? [0, 4, 8, 12] : [0, 3, 4, 7, 8, 11, 12, 13, 15]
        if (takPattern.includes(s)) {
          const accent = [0, 4, 8, 12].includes(s) ? 1 : 0.52
          place(perc, sabarTak(0.9 + rnd() * 0.25), at, 0.5 * accent)
        }
        if (!intro && (s === 2 || s === 10)) place(perc, ginS, at, 0.42)
      }

      // Shaker continu, accentué sur les temps.
      if (!tail) both(shakerS, at, s % 4 === 0 ? 0.26 : 0.13, s % 2 ? 0.25 : -0.25)
    }

    // Roulement sabar en fin de mesure, juste avant chaque coupe du montage.
    const rollBars = [0, 2, 4, 5, 6]
    if (rollBars.includes(bar)) {
      for (let r = 0; r < 6; r++) {
        const at = barAt + BAR - BEAT * 0.75 + r * (BEAT * 0.75) / 6
        place(perc, sabarTak(1 + r * 0.06), at, 0.22 + r * 0.07)
      }
    }
  }

  // Les percussions passent par la réverbération, pas les graves : une
  // réverbération sur le kick rendrait tout le bas boueux.
  const wet = reverb(perc, 0.3)
  for (let i = 0; i < wet.length; i++) {
    left[i] += wet[i] * 0.52
    right[i] += wet[i] * 0.48
  }

  // Fondu d'entrée de 15 ms. Le kick tombe sur le tout premier échantillon :
  // sans ça, le morceau démarre sur une marche, et l'encodeur AAC sonne
  // dessus — un clic net, à -0,6 dBFS, à chaque lecture de la vidéo.
  const fade = Math.round(0.015 * SR)
  for (let i = 0; i < fade; i++) {
    const g = i / fade
    left[i] *= g
    right[i] *= g
  }

  return [left, right]
}

/* ------------------------------------------------------------- bruitages */

/** Souffle de transition : du bruit filtré dont la bande monte puis retombe. */
const buildWhoosh = () => {
  rnd = mulberry32(77)
  const len = 0.42
  const raw = buffer(len)
  for (let i = 0; i < raw.length; i++) {
    const t = i / SR
    const x = t / len
    // Cloche d'amplitude : le souffle culmine à la coupe, pas avant.
    raw[i] = noise() * Math.pow(Math.sin(Math.PI * x), 1.6)
  }
  // Balayage de bande approximé par trois passes, additionnées en décalé.
  const out = buffer(len)
  for (const [freq, at, gain] of [
    [500, 0.0, 0.5],
    [1600, 0.12, 0.7],
    [4200, 0.22, 0.5],
  ]) {
    place(out, biquad(raw, 'bp', freq, 0.9), at, gain)
  }
  return reverb(out, 0.18)
}

/** Pop : la pastille qui arrive. Sinus bref qui descend, plus un clic. */
const buildPop = () => {
  rnd = mulberry32(5)
  const b = buffer(0.14)
  let phase = 0
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const f = 320 + 760 * Math.exp(-t / 0.018)
    phase += (2 * Math.PI * f) / SR
    b[i] = Math.sin(phase) * decay(t, 0.026, 0.0008) + noise() * decay(t, 0.004) * 0.25
  }
  return b
}

/** Tic : le cliquetis des roues du compteur. Très court, très sec. */
const buildTick = () => {
  rnd = mulberry32(9)
  const raw = buffer(0.04)
  for (let i = 0; i < raw.length; i++) {
    const t = i / SR
    raw[i] = noise() * decay(t, 0.0035, 0.0002)
  }
  return biquad(raw, 'bp', 3400, 2.2)
}

/** Ding : cloche inharmonique, pour « livraison gratuite ». */
const buildDing = () => {
  const b = buffer(1.6)
  const partials = [
    [1046.5, 1],
    [2093, 0.5],
    [3139, 0.26],
    [4600, 0.12],
  ]
  for (const [f, g] of partials) {
    let phase = 0
    for (let i = 0; i < b.length; i++) {
      const t = i / SR
      phase += (2 * Math.PI * f) / SR
      b[i] += Math.sin(phase) * Math.exp(-t / (0.45 / Math.sqrt(g + 0.2))) * g * 0.3
    }
  }
  return reverb(b, 0.3)
}

/* ------------------------------------------------------------------ sortie */

/** Limiteur doux puis normalisation au niveau crête demandé. */
const finish = (channels, peakDb) => {
  const target = Math.pow(10, peakDb / 20)
  let peak = 0
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) {
      ch[i] = Math.tanh(ch[i] * 0.9)
      peak = Math.max(peak, Math.abs(ch[i]))
    }
  }
  const gain = peak > 0 ? target / peak : 1
  for (const ch of channels) for (let i = 0; i < ch.length; i++) ch[i] *= gain
  return channels
}

const writeWav = (file, channels) => {
  const n = channels[0].length
  const ch = channels.length
  const data = Buffer.alloc(n * ch * 2)
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < ch; c++) {
      const v = Math.max(-1, Math.min(1, channels[c][i]))
      data.writeInt16LE(Math.round(v * 32767), (i * ch + c) * 2)
    }
  }
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(ch, 22)
  header.writeUInt32LE(SR, 24)
  header.writeUInt32LE(SR * ch * 2, 28)
  header.writeUInt16LE(ch * 2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  fs.writeFileSync(file, Buffer.concat([header, data]))
  const rms =
    Math.sqrt(
      channels.reduce((a, c) => a + c.reduce((s, v) => s + v * v, 0), 0) / (n * ch),
    ) || 1e-9
  console.log(
    `${path.basename(file)}  ${(data.length / 1024).toFixed(0)} Ko  ` +
      `RMS ${(20 * Math.log10(rms)).toFixed(1)} dBFS`,
  )
}

fs.mkdirSync(OUT, { recursive: true })

// La musique est volontairement basse : une voix off doit pouvoir passer
// par-dessus sans qu'on ait à la ré-encoder. Le reste du dosage se règle
// dans `src/Soundtrack.tsx`.
writeWav(path.join(OUT, 'music.wav'), finish(buildMusic(), -9))
writeWav(path.join(OUT, 'whoosh.wav'), finish([buildWhoosh()], -6))
writeWav(path.join(OUT, 'pop.wav'), finish([buildPop()], -7))
writeWav(path.join(OUT, 'tick.wav'), finish([buildTick()], -11))
writeWav(path.join(OUT, 'ding.wav'), finish([buildDing()], -6))
