import React from 'react'
import { C } from '../theme'
import { EASE, lerp } from '../components/anim'
import { useFrameScale } from './Screen'
import type { Box } from './geometry'
import { center } from './stage'

/**
 * Le curseur, et les clics.
 *
 * Il vit dans l'espace de la page, donc il vise les vraies coordonnees
 * relevees sur le site (`geometry.ts`) : quand il clique « Ajouter au
 * panier », il clique la ou le bouton se trouve vraiment. Mais il se
 * contre-echelonne sur le zoom de la camera, sinon un gros plan le rendrait
 * aussi grand qu'un maillot.
 *
 * Deux details font la difference entre un curseur et un carton qui glisse :
 * la trajectoire est courbee, et il repart avant d'etre arrive — une main ne
 * s'arrete jamais net sur un bouton.
 */

export type Waypoint = {
  /** Frame d'arrivee a ce point. */
  at: number
  /** Cible, en coordonnees de page. Une boite vise son centre. */
  to: Box | { x: number; y: number }
  /** Courbure de l'approche, en pixels de page. 0 = ligne droite. */
  arc?: number
}

const point = (t: Waypoint['to']) => ('w' in t ? center(t as Box) : (t as { x: number; y: number }))

export const Cursor: React.FC<{
  frame: number
  path: Waypoint[]
  /** Frames auxquelles le curseur enfonce le bouton. */
  clicks?: number[]
  /** Avant cette frame, le curseur n'est pas encore entre. */
  from?: number
  opacity?: number
  /**
   * Le doigt plutot que la fleche.
   *
   * Les plans de commande se jouent sur une capture de telephone. Une fleche
   * de souris posee sur un ecran tactile est le genre de detail qui ne se
   * remarque pas consciemment et decredibilise quand meme le plan : le
   * spectateur regarde son propre telephone pendant qu'il regarde le film.
   *
   * Le doigt est une pastille pleine et translucide, de la taille d'une vraie
   * pulpe — un disque opaque masquerait le champ qu'il vient toucher.
   */
  touch?: boolean
}> = ({ frame, path, clicks = [], from = 0, opacity = 1, touch = false }) => {
  const scale = useFrameScale()
  if (path.length === 0) return null

  // Position : on cherche le segment courant, puis on interpole.
  let pos = point(path[0].to)
  if (frame >= path[path.length - 1].at) {
    pos = point(path[path.length - 1].to)
  } else {
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i]
      const b = path[i + 1]
      if (frame < a.at || frame > b.at) continue
      const t = lerp(frame, [a.at, b.at], [0, 1], EASE.inOut)
      const pa = point(a.to)
      const pb = point(b.to)
      const x = pa.x + (pb.x - pa.x) * t
      const y = pa.y + (pb.y - pa.y) * t
      // La courbure : un demi-sinus perpendiculaire au deplacement.
      const arc = b.arc ?? 0
      const dx = pb.x - pa.x
      const dy = pb.y - pa.y
      const d = Math.hypot(dx, dy) || 1
      const bend = Math.sin(Math.PI * t) * arc
      pos = { x: x + (-dy / d) * bend, y: y + (dx / d) * bend }
      break
    }
  }

  // L'enfoncement : court, sec, et il laisse une onde derriere lui.
  const press = clicks.reduce((acc, at) => {
    const t = frame - at
    if (t < -2 || t > 8) return acc
    return Math.max(acc, lerp(t, [-2, 0, 3, 8], [0, 1, 0.6, 0]))
  }, 0)

  const appear = lerp(frame, [from, from + 6], [0, 1], EASE.out)
  if (appear <= 0) return null

  const size = 34 / scale
  const ring = 150 / scale

  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        opacity: appear * opacity,
        pointerEvents: 'none',
      }}
    >
      {clicks.map((at) => {
        const t = frame - at
        if (t < 0 || t > 20) return null
        const p = lerp(t, [0, 20], [0, 1], EASE.out)
        const r = p * ring
        return (
          <div
            key={at}
            style={{
              position: 'absolute',
              left: -r / 2,
              top: -r / 2,
              width: r,
              height: r,
              borderRadius: '50%',
              border: `${3 / scale}px solid ${C.primary}`,
              opacity: (1 - p) * 0.85,
            }}
          />
        )
      })}
      {touch ? (
        // La pulpe d'un doigt fait une quarantaine de pixels CSS sur un
        // telephone : c'est la taille du contact, et c'est pour ca que les
        // boutons tactiles font 48 px. La pastille est centree sur le point
        // vise, la ou la fleche, elle, pointe depuis son coin.
        <div
          style={{
            position: 'absolute',
            left: -size * 0.62,
            top: -size * 0.62,
            width: size * 1.24,
            height: size * 1.24,
            borderRadius: '50%',
            background: `${C.fg}38`,
            border: `${2.5 / scale}px solid ${C.fg}D0`,
            transform: `scale(${1 - press * 0.16})`,
            boxShadow: `0 ${4 / scale}px ${14 / scale}px rgba(0,0,0,.5)`,
          }}
        />
      ) : (
        <svg
          width={size}
          height={size * 1.35}
          viewBox="0 0 24 32"
          style={{
            position: 'absolute',
            left: -size * 0.1,
            top: -size * 0.1,
            transform: `scale(${1 - press * 0.18})`,
            transformOrigin: '10% 10%',
            filter: `drop-shadow(0 ${4 / scale}px ${10 / scale}px rgba(0,0,0,.6))`,
          }}
        >
          <path
            d="M3 2 L3 24.5 L8.8 19.2 L12.4 28.4 L16.6 26.6 L13 17.6 L21 17.2 Z"
            fill={C.fg}
            stroke={C.bgDeep}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  )
}

/**
 * Le halo qui suit le curseur sur sa cible : un rectangle qui epouse le
 * bouton vise. Il dit « c'est ici que ca se passe » sans masquer l'interface.
 */
export const Focus: React.FC<{
  box: Box
  frame: number
  at: number
  radius?: number
  color?: string
}> = ({ box, frame, at, radius = 10, color = C.primary }) => {
  const p = lerp(frame, [at, at + 10], [0, 1], EASE.out)
  const out = lerp(frame, [at + 26, at + 36], [0, 1], EASE.in)
  const o = p * (1 - out)
  if (o <= 0.01) return null
  const grow = (1 - p) * 14
  return (
    <div
      style={{
        position: 'absolute',
        left: box.x - 6 - grow,
        top: box.y - 6 - grow,
        width: box.w + 12 + grow * 2,
        height: box.h + 12 + grow * 2,
        border: `3px solid ${color}`,
        borderRadius: radius + 6,
        opacity: o,
        boxShadow: `0 0 30px ${color}55, inset 0 0 20px ${color}22`,
      }}
    />
  )
}
