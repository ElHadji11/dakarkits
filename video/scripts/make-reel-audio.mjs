/**
 * La bande-son du reel de 20 secondes, synthetisee echantillon par
 * echantillon. Aucune banque musicale : voir `synth.mjs` pour le pourquoi.
 *
 * 120 BPM, 30 fps : un temps dure 15 frames, une mesure 60. Les sections
 * ci-dessous sont **les memes nombres que `src/reel/timeline.ts`**, convertis
 * en secondes. Si une borne bouge la-bas, elle bouge ici, sinon la musique et
 * le montage se decollent.
 *
 *   0,0 s  la parade     trois maillots, trois prix
 *   5,0 s  la commande   recherche, taille, formulaire
 *  13,0 s  c'est passe   tout s'ouvre
 *  16,0 s  la signature  pleine puissance, puis la queue de reverb
 *
 * **Ce lit-ci est fait pour etre entendu seul.** Celui des deux premiers
 * films etait calibre pour passer sous une voix off ajoutee plus tard : il
 * sort a -9 dBFS crete et Remotion le joue a 0,6, soit une crete reelle vers
 * -13 dBFS et un RMS autour de -25. Sur un telephone, dans la rue, ca ne
 * s'entend pas — d'ou la note « il n'y a pas de son » sur un fichier qui en
 * a pourtant un. La voix off n'a jamais ete enregistree ; il n'y a donc plus
 * de raison de lui garder six decibels.
 *
 *   node scripts/make-reel-audio.mjs
 */
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
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
const DURATION = 22
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio')

/**
 * Les sections, en secondes — l'image de `BEATS` dans `src/reel/timeline.ts`.
 *
 * Tout a recule de **deux secondes**, soit exactement une mesure, le jour ou
 * le plan d'accroche a ete ajoute devant la parade. Une mesure et pas une
 * autre duree : a 120 BPM elle fait deux secondes pile, donc chaque coupe
 * retombe sur le meme temps de la mesure qu'avant et la grille n'a pas eu a
 * etre repensee. Un plan de 45 ou de 90 frames aurait decale chaque coupe sur
 * un temps faible.
 *
 * `parade` couvre aussi l'accroche : les deux partagent la meme texture, et
 * decouper une section de plus pour deux secondes aurait fait entendre un
 * raccord la ou le film n'en a pas.
 */
const T = { parade: 0, order: 7, done: 15, sign: 18 }

/** Les coupes du montage, en secondes. Un roulement sabar les precede. */
const CUTS = [2, 7, 9, 11, 15, 18]

/** Les entrees de maillot : frames 60, 105, 150. Un sub sous chacune. */
const JERSEYS_AT = [2, 3.5, 5.0]

/** Boom sub : le coup de poing sous un maillot qui arrive. */
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
 * Le fouette qui accompagne un changement de maillot : du bruit filtre dont
 * la bande monte puis retombe. Court — il doit finir avec le mouvement.
 */
const whip = (dur = 0.34) => {
  setSeed(7711)
  const b = buffer(dur)
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const x = t / dur
    // Une cloche sur la duree : le souffle culmine au milieu du geste.
    const env = Math.sin(Math.PI * x) ** 1.6
    b[i] = noise() * env
  }
  // Trois bandes decalees approximent un filtre qui balaie.
  const out = buffer(dur)
  let phase = 0
  for (let i = 0; i < b.length; i++) {
    const x = i / b.length
    phase += (2 * Math.PI * (400 + 2800 * Math.sin(Math.PI * x))) / SR
    out[i] = b[i] * 0.7 + Math.sin(phase) * b[i] * 0.5
  }
  return out
}

/* ------------------------------------------------------------- musique */

/**
 * Les deux lits, et ce qui les separe.
 *
 * Le film existe en trois versions qui ne different que par leurs deux
 * premieres secondes (`src/reel/hooks/`), et une accroche n'a pas seulement
 * une image : elle a une attaque. Le lion **s'installe** — il entre, il
 * parle, la musique tourne deja sous lui. Le choc du prix **frappe** — un
 * maillot claque et un montant tombe, et un lit qui ronronne dessous rend le
 * coup moins fort qu'il n'est.
 *
 * Ce qui ne change pas, et ne doit jamais changer : le tempo, la duree, les
 * bornes de section et les coupes. Elles sont l'image de `timeline.ts`, et un
 * lit qui les deplacerait ne serait plus le lit de ce montage. Ce qui change
 * tient dans l'objet ci-dessous, et c'est tout l'interet de l'avoir
 * rassemble ici plutot que disperse dans la boucle.
 */
const VARIANTS = {
  /**
   * Le lit d'origine. Am7 / Fmaj7, resolution en Cmaj7 sur « c'est
   * commande », groove des le premier echantillon.
   */
  'reel-music': {
    seed: 20261012,
    chords: {
      a: [220, 261.63, 329.63, 392.0], // Am7
      b: [174.61, 220, 261.63, 329.63], // Fmaj7
      lift: [261.63, 329.63, 392.0, 493.88], // Cmaj7
    },
    drum: [55, 58.27],
    /** Rien avant le premier temps : le film ouvre deja installe. */
    strike: false,
  },
  /**
   * Le lit du choc. Une quinte plus bas et en mineur de re : Dm7 / Bbmaj7,
   * resolution en Fmaj7. Garder les memes accords aurait donne la meme
   * couleur, et deux versions d'une publicite qui sonnent pareil se testent
   * mal — on ne sait plus ce qu'on compare.
   *
   * Et surtout : **un coup, puis un creux, puis le groove.** La premiere
   * mesure ne porte que le sub de la claque et une montee ; la batterie
   * n'entre qu'a la deuxieme, c'est-a-dire sur le premier maillot de la
   * parade. C'est ce creux qui fait exister le coup.
   */
  'reel-music-shock': {
    seed: 20261013,
    chords: {
      a: [146.83, 174.61, 220, 261.63], // Dm7
      b: [116.54, 146.83, 174.61, 220], // Bbmaj7
      lift: [174.61, 220, 261.63, 329.63], // Fmaj7
    },
    drum: [48.99, 51.91],
    strike: true,
  },
}

/**
 * La montee de l'accroche du choc : du bruit filtre dont la bande s'ouvre, de
 * la claque jusqu'au premier temps de la deuxieme mesure.
 *
 * Elle ne remplace pas le groove, elle tient la place ou il n'est pas. Sans
 * elle, les deux secondes entre le coup et la parade seraient du silence pur,
 * et un silence de deux secondes au debut d'un reel se lit comme un fichier
 * casse.
 */
const swell = (dur = 1.6) => {
  setSeed(4221)
  const b = buffer(dur)
  let phase = 0
  for (let i = 0; i < b.length; i++) {
    const x = i / b.length
    // La bande monte de 300 a 3 200 Hz, et l'amplitude suit une courbe
    // concave : presque rien pendant la premiere moitie, tout a la fin.
    phase += (2 * Math.PI * (300 + 2900 * x * x)) / SR
    b[i] = (noise() * 0.6 + Math.sin(phase) * 0.5) * x * x * x
  }
  return b
}

const buildMusic = (variant) => {
  const V = VARIANTS[variant]
  setSeed(V.seed)
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

  // Deux accords qui tournent, et un seul endroit du film ou quelque chose se
  // resout : « c'est commande ». Lesquels, c'est la variante qui le dit.
  for (let bar = 0; bar < 10; bar += 2) {
    const at = bar * BAR
    const lift = at >= T.done
    const chord = lift ? V.chords.lift : bar % 4 === 0 ? V.chords.a : V.chords.b
    const p = pad(chord, BAR * 2)
    // Sur le lit du choc, la nappe de la premiere mesure entre a demi-voix :
    // elle laisse le sub et la montee occuper l'accroche seuls.
    const hush = V.strike && at === 0 ? 0.45 : 1
    place(left, p, at, (lift ? 0.8 : 0.52) * hush)
    place(right, p, at + 0.012, (lift ? 0.8 : 0.52) * hush)
  }

  const SIXTEENTH = BEAT / 4

  for (let bar = 0; bar < 10; bar++) {
    const barAt = bar * BAR
    if (barAt >= DURATION) break
    const last = bar === 9

    for (let s = 0; s < 16; s++) {
      const at = barAt + s * SIXTEENTH
      if (at >= DURATION) break

      const inParade = at < T.order
      const inOrder = at >= T.order && at < T.done
      const inDone = at >= T.done && at < T.sign
      const inSign = at >= T.sign

      /** La mesure de l'accroche, que le lit du choc laisse presque vide. */
      const inStrike = V.strike && bar === 0

      // Kick : sur 1 et 3 partout, des le tout premier echantillon. Le film
      // ouvre sur un maillot plein cadre, pas sur une montee — le son fait
      // pareil. Le lit du choc garde le coup du premier temps et se tait
      // ensuite jusqu'a la parade.
      if (s === 0 || s === 8) {
        if (!inStrike || s === 0) both(kickS, at, inDone ? 0.8 : 1.0)
      } else if (!inDone && !inStrike && s === 14 && bar % 2 === 1) {
        both(kickS, at, 0.82)
      }

      // Log drum : la signature du genre. Il s'efface pendant la commande —
      // c'est la que passent les clics et les touches, et deux timbres
      // percussifs dans la meme bande se mangent.
      if (!inOrder && !inStrike && [6, 10, 11, 14].includes(s)) {
        const root = s === 11 ? V.drum[1] : V.drum[0]
        both(logDrum(root), at, s === 11 ? 0.52 : 0.74)
      }

      // Sabar. Le motif se densifie sur la commande : l'image y est pleine de
      // petits gestes, le son les porte.
      const takPattern = inParade
        ? [0, 3, 4, 8, 11, 12]
        : inOrder
          ? [0, 3, 4, 7, 8, 11, 12, 13, 15]
          : [0, 4, 8, 12]
      if (takPattern.includes(s) && !inStrike) {
        const accent = [0, 4, 8, 12].includes(s) ? 1 : 0.54
        place(perc, sabarTak(0.9 + rand() * 0.25), at, 0.52 * accent)
      }
      if (!inDone && !inStrike && (s === 2 || s === 10)) place(perc, ginS, at, 0.44)

      // Shaker : la derniere mesure le laisse partir, pour que la reverb
      // finisse seule.
      if (!(last && s > 8) && !inStrike) {
        both(shakerS, at, s % 4 === 0 ? 0.28 : 0.14, s % 2 ? 0.25 : -0.25)
      }

      // Et un peu plus d'air sur la signature.
      if (inSign && (s === 6 || s === 14)) place(perc, ginS, at, 0.3)
    }
  }

  /*
   * L'accroche du choc : le coup, puis la montee.
   *
   * Le sub est **le plus grave et le plus long du film** — c'est la claque du
   * maillot sur la frame 0, et elle doit faire lever la tete avant meme que
   * le montant soit lu. La montee prend le relais et meurt sur le premier
   * temps de la parade, ou le groove entre pour de bon.
   *
   * Les deux accroches du choc tombent sur les memes frames : le maillot
   * claque a 0 dans les deux, et le deuxieme accent — le nom du club pour
   * l'une, la bascule pour l'autre — vers 0,65 s. Un lit par accroche aurait
   * fait deux fichiers pour deux evenements identiques.
   */
  if (V.strike) {
    both(sub(40, 1.9), 0, 1.0)
    place(left, swell(), 0.12, 0.5)
    place(right, swell(), 0.13, 0.5)
    both(sub(54, 0.8), 0.65, 0.5)
  }

  // Les trois maillots : un sub sous chacun, le premier le plus fort — c'est
  // la frame 0, et c'est elle qui doit faire lever la tete.
  JERSEYS_AT.forEach((at, i) => both(sub(50 - i * 2, 1.2), at, i === 0 ? 1.0 : 0.72))
  // L'offre qui se pose sur le troisieme maillot (frame 104).
  both(sub(56, 0.9), 104 / 30, 0.55)

  // Le fouette, sur les deux changements de maillot.
  for (const at of JERSEYS_AT.slice(1)) {
    place(left, whip(), at - 0.17, 0.62)
    place(right, whip(), at - 0.16, 0.62)
  }

  // « C'est commande » : tout s'ouvre. Puis la signature, pleine puissance.
  both(sub(44, 1.7), T.done, 0.95)
  both(sub(52, 1.7), T.sign, 1.0)

  // Roulement sabar avant chaque coupe du montage.
  for (const cut of CUTS) {
    for (let r = 0; r < 6; r++) {
      place(
        perc,
        sabarTak(1 + r * 0.06),
        cut - BEAT * 0.75 + (r * (BEAT * 0.75)) / 6,
        0.22 + r * 0.075,
      )
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
  // Et une sortie de 500 ms : la queue de reverb doit mourir avant la
  // derniere frame, pas etre coupee par la fin du fichier.
  const tail = Math.round(0.5 * SR)
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

// -4 dBFS crete, contre -9 pour les deux premiers films : ce lit est le son
// du fichier, pas un fond sous une voix. Avec le volume de `ReelAudio`, la
// crete reelle du rendu tombe vers -5,5 dBFS — il reste de quoi encaisser les
// clics et les touches sans ecreter.
for (const name of Object.keys(VARIANTS)) {
  writeWav(path.join(OUT, name + '.wav'), finish(buildMusic(name), -4))
  console.log('  ' + name + '.wav')
}
writeWav(path.join(OUT, 'whip.wav'), finish([whip()], -6))
