/**
 * La boite a outils de synthese, partagee par les deux bandes-son.
 *
 * Aucune banque musicale : chaque son est fabrique echantillon par
 * echantillon, donc libre de droits. C'est ce qui protege le compte
 * publicitaire — un morceau du commerce pose sur une video de vetements se
 * fait reperer automatiquement.
 *
 * Les percussions sont des frappes sabar : le tak sec du baton et le gin
 * ouvert de la main. C'est ce qui ancre les films a Dakar.
 *
 * Extrait de `make-audio.mjs` sans rien changer : les fichiers du premier
 * film doivent ressortir identiques, octet pour octet.
 */
import fs from 'node:fs'
import path from 'node:path'

export const SR = 44100

/** Le generateur partage. `setSeed` avant chaque bloc qui utilise du bruit. */
let rnd = () => 0
export const setSeed = (seed) => {
  rnd = mulberry32(seed)
}
/** PRNG déterministe : relancer le script doit redonner le même fichier. */
export const mulberry32 = (seed) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
/** Un tirage du generateur partage. Meme suite d appels, meme fichier. */
export const rand = () => rnd()
export const noise = () => rnd() * 2 - 1

export const buffer = (seconds) => new Float32Array(Math.ceil(seconds * SR))

/** Mixe `src` dans `dst` à `at` secondes. */
export const place = (dst, src, at, gain = 1) => {
  const start = Math.round(at * SR)
  for (let i = 0; i < src.length; i++) {
    const j = start + i
    if (j >= 0 && j < dst.length) dst[j] += src[i] * gain
  }
}

/** Enveloppe percussive : attaque quasi nulle, décroissance exponentielle. */
export const decay = (t, tau, attack = 0.002) =>
  Math.min(1, t / attack) * Math.exp(-t / tau)

/** Biquad RBJ. Un seul passage, suffisant pour des percussions. */
export const biquad = (input, type, freq, q) => {
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
export const reverb = (input, mix = 0.22) => {
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
export const kick = () => {
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
export const logDrum = (root) => {
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
export const sabarTak = (bright = 1) => {
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
export const sabarGin = () => {
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

export const shaker = () => {
  const raw = buffer(0.07)
  for (let i = 0; i < raw.length; i++) {
    const t = i / SR
    raw[i] = noise() * decay(t, 0.009, 0.001)
  }
  return biquad(raw, 'hp', 6800, 0.8)
}

/** Nappe : quatre voix légèrement désaccordées, attaque lente, très filtrée. */
export const pad = (freqs, dur) => {
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

/* ------------------------------------------------------------------ sortie */

/** Limiteur doux puis normalisation au niveau crête demandé. */
export const finish = (channels, peakDb) => {
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

export const writeWav = (file, channels) => {
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

