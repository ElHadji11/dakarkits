/**
 * La bande-son du spot de 20 secondes, synthetisee echantillon par
 * echantillon. Aucune banque musicale : voir `synth.mjs` pour le pourquoi.
 *
 * 120 BPM, 30 fps : un temps dure 15 frames, une mesure 60. Les sections
 * ci-dessous sont **les memes nombres que `src/spot/timeline.ts`**, convertis
 * en secondes. Si une borne bouge la-bas, elle bouge ici, sinon la musique
 * et le montage se decollent.
 *
 *   0,0 s  accroche      le probleme en cinq mots
 *   3,0 s  le drop       l'interface se monte
 *   7,0 s  les gestes    trois fonctions, trois clics
 *  13,0 s  le chiffre    tout tombe, il ne reste que le compteur
 *  16,0 s  la signature  pleine puissance, puis la queue de reverb
 *
 *   node scripts/make-spot-audio.mjs
 */
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  biquad,
  buffer,
  decay,
  finish,
  kick,
  logDrum,
  noise,
  pad,
  place,
  rand,
  reverb,
  sabarGin,
  sabarTak,
  setSeed,
  shaker,
  SR,
  writeWav,
} from './synth.mjs'

const BPM = 120
const BEAT = 60 / BPM // 0,5 s
const BAR = BEAT * 4 // 2 s
const DURATION = 20
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio')

/** Les sections, en secondes — l'image de `BEATS` dans `timeline.ts`. */
const T = { hook: 0, drop: 3, gestes: 7, chiffre: 13, signature: 16 }

/* ------------------------------------------------- instruments en plus */

/** Boom sub : le coup de poing sous les gros titres. Peu de haut, du poids. */
const sub = (root = 48, dur = 1.1) => {
  const b = buffer(dur)
  let phase = 0
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const f = root * (1 + 1.1 * Math.exp(-t / 0.05))
    phase += (2 * Math.PI * f) / SR
    b[i] = Math.tanh(Math.sin(phase) * 1.3) * decay(t, 0.28, 0.003)
  }
  return b
}

/**
 * La montee avant le drop : du bruit dont la bande s'ouvre, plus une
 * sinusoide qui glisse vers l'aigu. Les deux ensemble, sinon ca siffle sans
 * pousser.
 */
const riser = (dur = 1) => {
  setSeed(4242)
  const raw = buffer(dur)
  for (let i = 0; i < raw.length; i++) raw[i] = noise()
  // Trois bandes decalees approximent un filtre qui s'ouvre.
  const out = buffer(dur + 0.1)
  const bands = [
    [700, 0.0],
    [2000, 0.3],
    [5200, 0.6],
  ]
  for (const [freq, from] of bands) {
    const band = biquad(raw, 'bp', freq, 0.8)
    for (let i = 0; i < band.length; i++) {
      const x = i / band.length
      out[i] += band[i] * Math.max(0, (x - from) / (1 - from)) ** 1.5 * 0.5
    }
  }
  let phase = 0
  for (let i = 0; i < out.length && i < raw.length; i++) {
    const x = i / raw.length
    phase += (2 * Math.PI * (220 + 900 * x * x)) / SR
    out[i] += Math.sin(phase) * x ** 2 * 0.18
  }
  // Il s'arrete net sur le temps : une montee qui deborde noie le kick.
  const cut = Math.round(0.012 * SR)
  for (let i = 0; i < cut; i++) out[out.length - 1 - i] *= i / cut
  return out
}

/**
 * Le clic de souris. Deux impulsions : l'enfoncement, puis le relachement
 * huit millisecondes plus tard. Sans le second, ca fait un tic de metronome.
 */
const click = () => {
  setSeed(17)
  const b = buffer(0.07)
  for (const [at, gain, tau] of [
    [0, 1, 0.0022],
    [0.009, 0.55, 0.0016],
  ]) {
    const start = Math.round(at * SR)
    for (let i = 0; i < b.length - start; i++) {
      const t = i / SR
      b[start + i] += noise() * decay(t, tau, 0.0002) * gain
    }
  }
  return biquad(b, 'bp', 2600, 1.1)
}

/** La touche du clavier : plus sourde que le clic, et plus courte. */
const keyTap = () => {
  setSeed(23)
  const b = buffer(0.045)
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    b[i] = noise() * decay(t, 0.0025, 0.0002)
  }
  return biquad(b, 'bp', 1500, 1.4)
}

/** L'impact du chiffre : un sub, un bruit, et la reverb derriere. */
const impact = () => {
  setSeed(99)
  const b = buffer(1.4)
  const s = sub(44, 1.4)
  for (let i = 0; i < s.length; i++) b[i] += s[i] * 0.9
  const crack = buffer(0.3)
  for (let i = 0; i < crack.length; i++) {
    const t = i / SR
    crack[i] = noise() * decay(t, 0.035, 0.0006)
  }
  const bright = biquad(crack, 'hp', 1800, 0.7)
  for (let i = 0; i < bright.length; i++) b[i] += bright[i] * 0.5
  return reverb(b, 0.22)
}

/* ------------------------------------------------------------- musique */

const buildMusic = () => {
  setSeed(20261011)
  const left = buffer(DURATION + 1)
  const right = buffer(DURATION + 1)
  const perc = buffer(DURATION + 1)

  const both = (src, at, gain, pan = 0) => {
    place(left, src, at, gain * (1 - Math.max(0, pan)))
    place(right, src, at, gain * (1 + Math.min(0, pan)))
  }

  const kickS = kick()
  const ginS = sabarGin()
  const shakerS = shaker()
  const subS = sub()

  // Am7 / Fmaj7 : les memes deux accords que le premier film, c'est la meme
  // boutique. Sur le chiffre, on passe a Dm7 — plus tendu, ca tient trois
  // secondes sans percussions.
  const Am7 = [220, 261.63, 329.63, 392.0]
  const Fmaj7 = [174.61, 220, 261.63, 329.63]
  const Dm7 = [146.83, 174.61, 220, 261.63]
  for (let bar = 0; bar < 10; bar += 2) {
    const at = bar * BAR
    const chord = at >= T.chiffre && at < T.signature ? Dm7 : bar % 4 === 0 ? Am7 : Fmaj7
    const p = pad(chord, BAR * 2)
    place(left, p, at, at >= T.chiffre && at < T.signature ? 0.78 : 0.5)
    place(right, p, at + 0.012, at >= T.chiffre && at < T.signature ? 0.78 : 0.5)
  }

  const SIXTEENTH = BEAT / 4

  for (let bar = 0; bar < 10; bar++) {
    const barAt = bar * BAR
    if (barAt >= DURATION) break
    const last = bar === 9

    for (let s = 0; s < 16; s++) {
      const at = barAt + s * SIXTEENTH
      if (at >= DURATION) break

      // La section du chiffre commence a 13 s, soit au milieu de la mesure 6 :
      // la coupe tombe sur le temps 3, pas sur le premier temps.
      const inChiffre = at >= T.chiffre && at < T.signature
      const inHook = at < T.drop
      const inGestes = at >= T.gestes && at < T.chiffre

      // Kick : sur 1 et 3 partout ; le contretemps seulement quand ca roule.
      if (s === 0 || s === 8) {
        both(kickS, at, inChiffre ? 0.7 : 0.95)
      } else if (!inChiffre && !inHook && s === 14 && bar % 2 === 1) {
        both(kickS, at, 0.8)
      }

      // Log drum : la signature du genre. Absent sur l'accroche et sur le
      // chiffre — c'est son retour qui relance la fin.
      if (!inHook && !inChiffre && [6, 10, 11, 14].includes(s)) {
        const root = s === 11 ? 58.27 : 55
        both(logDrum(root), at, s === 11 ? 0.5 : 0.72)
      }

      // Sabar.
      if (!inChiffre) {
        const takPattern = inHook ? [0, 8] : inGestes ? [0, 3, 4, 7, 8, 11, 12, 13, 15] : [0, 3, 4, 8, 11, 12]
        if (takPattern.includes(s)) {
          const accent = [0, 4, 8, 12].includes(s) ? 1 : 0.52
          place(perc, sabarTak(0.9 + rand() * 0.25), at, 0.5 * accent)
        }
        if (!inHook && (s === 2 || s === 10)) place(perc, ginS, at, 0.42)
      }

      // Shaker : il s'efface sur le chiffre, et la derniere mesure le laisse
      // partir pour que la reverb finisse seule.
      if (!inChiffre && !(last && s > 8)) {
        both(shakerS, at, s % 4 === 0 ? 0.26 : 0.13, s % 2 ? 0.25 : -0.25)
      }
    }
  }

  // Les trois mots de l'accroche tombent a 0 s, 0,5 s et 1 s ; « TROP CHER »
  // a 1,5 s. Un sub sous chacun, le dernier deux fois plus fort.
  for (const [at, g] of [
    [0, 0.6],
    [0.5, 0.45],
    [1.0, 0.45],
    [1.5, 1.0],
  ])
    both(subS, at, g)

  // La montee vers le drop, puis l'impact qui ouvre le plan du produit.
  place(left, riser(1.0), T.drop - 1.0, 0.5)
  place(right, riser(1.0), T.drop - 1.0, 0.5)
  both(sub(52, 1.3), T.drop, 0.9)

  // Le chiffre : tout tombe, un seul coup sous le compteur.
  both(sub(40, 1.6), T.chiffre, 0.85)
  place(left, riser(0.85), T.signature - 0.85, 0.42)
  place(right, riser(0.85), T.signature - 0.85, 0.42)
  both(sub(52, 1.6), T.signature, 0.95)

  // Roulement sabar avant chaque coupe du montage.
  for (const cut of [T.drop, T.gestes, 9, 11, T.chiffre, T.signature]) {
    for (let r = 0; r < 6; r++) {
      place(perc, sabarTak(1 + r * 0.06), cut - BEAT * 0.75 + (r * (BEAT * 0.75)) / 6, 0.2 + r * 0.07)
    }
  }

  const wet = reverb(perc, 0.3)
  for (let i = 0; i < wet.length; i++) {
    left[i] += wet[i] * 0.52
    right[i] += wet[i] * 0.48
  }

  // Fondu d'entree de 15 ms : le kick tombe sur le tout premier echantillon,
  // et sans ca l'encodeur AAC sonne dessus — un clic net a chaque lecture.
  const fade = Math.round(0.015 * SR)
  for (let i = 0; i < fade; i++) {
    const g = i / fade
    left[i] *= g
    right[i] *= g
  }
  // Et une sortie de 400 ms : la queue de reverb doit mourir avant la
  // derniere frame, pas etre coupee par la fin du fichier.
  const tail = Math.round(0.4 * SR)
  const end = Math.round(DURATION * SR)
  for (let i = 0; i < tail; i++) {
    const g = 1 - i / tail
    const j = end - tail + i
    if (j < left.length) {
      left[j] *= g
      right[j] *= g
    }
  }

  return [left.subarray(0, end), right.subarray(0, end)]
}

/* -------------------------------------------------------------- sortie */

fs.mkdirSync(OUT, { recursive: true })

// Meme dosage que le premier film : la musique passe sous une voix off
// ajoutee plus tard sans qu'on ait a la re-encoder.
writeWav(path.join(OUT, 'spot-music.wav'), finish(buildMusic(), -9))
writeWav(path.join(OUT, 'click.wav'), finish([click()], -9))
writeWav(path.join(OUT, 'key.wav'), finish([keyTap()], -15))
writeWav(path.join(OUT, 'riser.wav'), finish([riser(1)], -8))
writeWav(path.join(OUT, 'impact.wav'), finish([impact()], -5))
