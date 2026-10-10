import { Easing, interpolate, random, spring } from 'remotion'
import { noise2D } from '@remotion/noise'
import { FPS } from '../theme'

/** Interpolation bornée des deux côtés — le défaut partout dans ce projet. */
export const lerp = (
  frame: number,
  input: readonly number[],
  output: readonly number[],
  easing?: (n: number) => number,
) =>
  interpolate(frame, input as number[], output as number[], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  })

export const EASE = {
  /** Décélération franche : ce qui entre à l'écran. */
  out: Easing.bezier(0.16, 1, 0.3, 1),
  /** Accélération franche : ce qui sort du cadre. */
  in: Easing.bezier(0.7, 0, 0.84, 0),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  /** Rebond court, pour les badges et les pastilles. */
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
} as const

type SpringOpts = { delay?: number; damping?: number; mass?: number; stiffness?: number }

/** `spring()` avec les réglages par défaut du projet et un retard en frames. */
export const pop = (frame: number, o: SpringOpts = {}) =>
  spring({
    fps: FPS,
    frame: frame - (o.delay ?? 0),
    config: {
      damping: o.damping ?? 14,
      mass: o.mass ?? 0.7,
      stiffness: o.stiffness ?? 140,
    },
  })

/** Ressort très amorti : aucun dépassement, pour les déplacements de blocs. */
export const glide = (frame: number, delay = 0) =>
  spring({ fps: FPS, frame: frame - delay, config: { damping: 200, mass: 1.1 } })

/**
 * Secousse caméra. Du bruit cohérent plutôt que du hasard par frame : l'image
 * tremble au lieu de scintiller.
 */
export const shake = (frame: number, at: number, power = 18, decay = 10) => {
  const t = frame - at
  if (t < 0 || t > decay * 2) return { x: 0, y: 0, r: 0 }
  const fall = Math.exp(-t / decay)
  return {
    x: noise2D('shake-x', t * 0.9, at) * power * fall,
    y: noise2D('shake-y', t * 0.9, at) * power * fall,
    r: noise2D('shake-r', t * 0.6, at) * power * 0.05 * fall,
  }
}

/** Flottement lent et déterministe — utilisé sur les cartes et les téléphones. */
export const drift = (seed: number, frame: number, amp = 10, speed = 0.02) =>
  noise2D(`drift-${seed}`, frame * speed, seed * 3.1) * amp

/**
 * Impulsion qui ne vaut que dans sa fenêtre — zéro partout ailleurs.
 * `lerp` ne convient pas ici : borné des deux côtés, il rendrait la valeur
 * de départ pour toutes les frames précédant la fenêtre.
 */
export const burst = (frame: number, at: number, len: number, peak: number) => {
  const t = frame - at
  if (t < 0 || t > len) return 0
  return peak * (1 - t / len)
}

/** Éclat blanc sur quelques frames, pour masquer une coupe. */
export const flash = (frame: number, at: number, len = 6, peak = 0.85) =>
  lerp(frame, [at, at + 1, at + len], [0, peak, 0])

export { random, noise2D }
