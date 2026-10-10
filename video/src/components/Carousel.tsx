import React, { useMemo } from 'react'
import { AbsoluteFill, Img } from 'remotion'
import { DISPLAY, SANS } from '../fonts'
import { C, HEIGHT, JERSEYS, discount, jerseyFile, money, type Jersey } from '../theme'
import { drift, random } from './anim'

const COL_W = 468
const TILE_H = 500
const GAP = 36

/** Une tuile du carrousel : la photo, le montant, la remise. Pas de nom —
 *  à cette vitesse il ne se lirait pas, et il alourdirait la colonne. */
const Tile: React.FC<{ jersey: Jersey; seed: number; frame: number }> = ({
  jersey,
  seed,
  frame,
}) => {
  const off = discount(jersey)
  return (
    <div
      style={{
        width: COL_W,
        height: TILE_H,
        borderRadius: 32,
        background: `linear-gradient(170deg, ${C.cardHi}, ${C.card})`,
        border: `1px solid ${C.border}`,
        position: 'relative',
        overflow: 'hidden',
        flex: `0 0 ${TILE_H}px`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 38%, ${C.primary}1F, transparent 66%)`,
        }}
      />
      <Img
        src={jerseyFile(jersey)}
        style={{
          position: 'absolute',
          left: '50%',
          top: '46%',
          width: '82%',
          transform: `translate(-50%, -50%) translateY(${drift(seed, frame, 7, 0.02)}px)`,
          objectFit: 'contain',
          filter: 'drop-shadow(0 20px 26px rgba(0,0,0,0.6))',
        }}
      />
      {off ? (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            background: C.primary,
            color: C.bg,
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 26,
            padding: '7px 18px',
            borderRadius: 999,
          }}
        >
          -{off} %
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: 24,
          bottom: 20,
          fontFamily: DISPLAY,
          fontSize: 54,
          color: C.fg,
          lineHeight: 1,
          textShadow: '0 4px 20px rgba(0,0,0,0.9)',
        }}
      >
        {money(jersey.price)}
      </div>
    </div>
  )
}

/**
 * Deux pioches déterministes, tirées de moitiés **disjointes** du catalogue.
 *
 * C'est la seule garantie qui tienne. Un mélange par colonne collait deux
 * fois le même maillot côte à côte ; une pioche commune distribuée en
 * alternance réglait le cas à l'arrêt, mais les colonnes défilent en sens
 * inverse — leur décalage change à chaque frame, et deux positions éloignées
 * dans la pioche finissaient par se retrouver voisines à l'écran.
 *
 * En partageant le catalogue en deux, aucun maillot d'une colonne ne peut
 * apparaître dans l'autre, quel que soit le défilement. À l'intérieur d'une
 * colonne, la fenêtre couvre les quatre tuiles visibles à la fois.
 */
const WINDOW = 4

const deck = (seed: string, length: number, pool: Jersey[]): Jersey[] => {
  const out: Jersey[] = []
  for (let i = 0; i < length; i++) {
    const recent = out.slice(-(WINDOW - 1))
    const choices = pool.filter((j) => !recent.includes(j))
    const from = choices.length ? choices : pool
    out.push(from[Math.floor(random(`${seed}-${i}`) * from.length) % from.length])
  }
  return out
}

/**
 * Deux colonnes qui défilent en sens inverse, en plein cadre et sous le
 * texte.
 *
 * Chaque colonne répète le catalogue trois fois, mélangé différemment : à
 * cette vitesse l'œil lit de l'abondance et ne peut pas compter les maillots.
 * Les deux sens opposés évitent que l'ensemble ne glisse comme un seul bloc.
 */
export const Carousel: React.FC<{
  frame: number
  travel: number
  /** Maillots tenus hors du carrousel — typiquement celui mis en avant. */
  exclude?: Jersey[]
}> = ({ frame, travel, exclude = [] }) => {
  const columns = useMemo(() => {
    const pool = JERSEYS.filter((j) => !exclude.includes(j))
    const half = Math.ceil(pool.length / 2)
    return [
      { dir: 1, items: deck('col-a', 39, pool.slice(0, half)) },
      { dir: -1, items: deck('col-b', 39, pool.slice(half)) },
    ]
  }, [exclude])
  const stripHeight = columns[0].items.length * (TILE_H + GAP)

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: GAP, justifyContent: 'center' }}>
        {columns.map((col, ci) => {
          // Chaque colonne démarre à une hauteur différente, sinon les deux
          // rangées de tuiles s'alignent et la grille redevient lisible.
          const offset = ci === 0 ? -TILE_H * 0.4 : -TILE_H * 1.15
          const y = offset - ((col.dir * travel + stripHeight) % stripHeight)
          return (
            <div
              key={ci}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: GAP,
                transform: `translateY(${y}px)`,
              }}
            >
              {col.items.map((j, i) => (
                <Tile key={`${ci}-${i}`} jersey={j} seed={ci * 100 + i} frame={frame} />
              ))}
            </div>
          )
        })}
      </div>
      {/* Fondu haut et bas : les colonnes ne doivent pas se terminer net. */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(to bottom, ${C.bgDeep} 0%, transparent ${
            (260 / HEIGHT) * 100
          }%, transparent ${(1 - 260 / HEIGHT) * 100}%, ${C.bgDeep} 100%)`,
        }}
      />
    </AbsoluteFill>
  )
}
