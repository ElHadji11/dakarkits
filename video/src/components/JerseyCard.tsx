import React from 'react'
import { Img } from 'remotion'
import { DISPLAY, SANS } from '../fonts'
import { C, discount, jerseyFile, money, type Jersey } from '../theme'
import { drift, lerp } from './anim'

type Props = {
  jersey: Jersey
  frame: number
  index: number
  /** 0 → absente, 1 → posée. */
  entry: number
  width?: number
  /** Inclinaison 3D, en degrés : la carte regarde le centre du cadre. */
  tilt?: number
}

/**
 * La carte produit, reprise de la grille de la boutique : photo détourée sur
 * fond carte, nom en Inter, montant en Bebas, pastille de remise.
 *
 * Le montant est bien en Bebas — c'est un montant mis en avant, pas un nom de
 * maillot. Le nom, lui, reste en Inter : Bebas n'a que des capitales.
 */
export const JerseyCard: React.FC<Props> = ({
  jersey,
  frame,
  index,
  entry,
  width = 300,
  tilt = 0,
}) => {
  const off = discount(jersey)
  const bob = drift(index, frame, 9, 0.022)
  return (
    <div
      style={{
        width,
        flex: `0 0 ${width}px`,
        borderRadius: 26,
        background: `linear-gradient(170deg, ${C.cardHi}, ${C.card})`,
        border: `1px solid ${C.border}`,
        padding: 18,
        boxShadow: `0 30px 60px -20px rgba(0,0,0,0.75), 0 0 0 1px rgba(164,143,255,${
          0.05 + entry * 0.08
        })`,
        transform: `perspective(1400px) rotateY(${tilt}deg) translateY(${
          bob + (1 - entry) * 90
        }px) scale(${lerp(entry, [0, 1], [0.84, 1])})`,
        opacity: lerp(entry, [0, 0.3], [0, 1]),
      }}
    >
      <div
        style={{
          position: 'relative',
          borderRadius: 18,
          background: `radial-gradient(circle at 50% 35%, ${C.primary}1A, transparent 68%)`,
          height: width * 1.06,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Img
          src={jerseyFile(jersey)}
          style={{
            width: '86%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 18px 24px rgba(0,0,0,0.55))',
          }}
        />
        {off ? (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              background: C.primary,
              color: C.bg,
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 18,
              padding: '5px 12px',
              borderRadius: 999,
            }}
          >
            -{off} %
          </div>
        ) : null}
      </div>
      <div
        style={{
          marginTop: 14,
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 22,
          color: C.fg,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {jersey.name}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 17, color: C.muted, marginTop: 2 }}>
        {jersey.team}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 38, color: C.fg, lineHeight: 1 }}>
          {money(jersey.price)}
        </span>
        {jersey.was ? (
          <span
            style={{
              fontFamily: SANS,
              fontSize: 17,
              color: C.muted,
              textDecoration: 'line-through',
            }}
          >
            {money(jersey.was)}
          </span>
        ) : null}
      </div>
    </div>
  )
}
