import React from 'react'
import { DISPLAY, SANS } from '../fonts'
import { C } from '../theme'
import { EASE, lerp, pop } from '../components/anim'
import type { Box } from './geometry'

/**
 * La frappe, par-dessus un champ reel.
 *
 * Le formulaire a ete capture vide : rien n'a jamais ete envoye depuis la
 * production. Les lettres sont donc posees ici, dans la typographie du site
 * (Inter 16 px, la couleur du texte du theme), a l'interieur du vrai champ.
 *
 * Les decalages viennent des captures : le texte d'un champ commence a 13 px
 * de son bord, celui de la recherche a 61 px — apres la loupe.
 */
export const Typed: React.FC<{
  box: Box
  text: string
  frame: number
  /** Frame de la premiere lettre. */
  from: number
  /** Frames par caractere. 1 = trente caracteres par seconde. */
  per?: number
  fontSize?: number
  padLeft?: number
  /** Le haut du texte, si le champ est multiligne. */
  padTop?: number
  color?: string
  caret?: boolean
  /**
   * Masque le texte d'invite du champ pendant la frappe.
   *
   * Les champs ont ete captures **vides**, donc avec leur placeholder :
   * « Awa Diop », « 77 123 45 67 ». Sans ce masque, les lettres tapees se
   * superposent a l'invite et donnent « FatouNdiaye » illisible. Le masque
   * est un aplat de la couleur de fond du champ, relevee sur le site — on ne
   * redessine rien, on efface.
   */
  cover?: boolean
  /** La couleur de fond du champ, relevee sur le site par la capture. */
  fieldBg?: string
}> = ({
  box,
  text,
  frame,
  from,
  per = 1,
  fontSize = 16,
  padLeft = 13,
  padTop,
  color = C.fg,
  caret = true,
  cover = true,
  fieldBg = C.field,
}) => {
  const shown = Math.max(0, Math.min(text.length, Math.floor((frame - from) / per)))
  if (frame < from) return null
  const typing = shown < text.length
  // Le curseur de saisie clignote a deux hertz, et reste plein pendant la
  // frappe : un caret qui disparait au milieu d'un mot donne l'impression
  // que la frappe a decroche.
  const blink = typing ? 1 : Math.floor(frame / 8) % 2 === 0 ? 1 : 0.15

  return (
    <>
      {cover ? (
        <div
          style={{
            position: 'absolute',
            // Le masque commence apres l'icone du champ — la loupe de la
            // recherche est a gauche du texte, et l'effacer se verrait.
            left: box.x + Math.max(1, padLeft - 8),
            top: box.y + 1,
            width: box.w - Math.max(1, padLeft - 8) - 1,
            height: box.h - 2,
            background: fieldBg,
            borderRadius: 7,
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: box.x + padLeft,
          top: padTop === undefined ? box.y : box.y + padTop,
          height: padTop === undefined ? box.h : undefined,
          display: 'flex',
          alignItems: padTop === undefined ? 'center' : 'flex-start',
          fontFamily: SANS,
          fontSize,
          lineHeight: 1.4,
          color,
          whiteSpace: 'pre',
        }}
      >
        {text.slice(0, shown)}
        {caret ? (
          <span
            style={{
              display: 'inline-block',
              width: 2,
              height: fontSize * 1.15,
              marginLeft: 1,
              background: C.primary,
              opacity: blink,
            }}
          />
        ) : null}
      </div>
    </>
  )
}

/**
 * Un mot de l'accroche. Il ne glisse pas : il tombe.
 *
 * L'echelle part au-dessus de 1 et le flou d'echelle est simule par un flou
 * qui se resorbe en quatre frames — c'est ce qui fait la frappe, plus que le
 * ressort lui-meme.
 */
export const Slam: React.FC<{
  children: React.ReactNode
  frame: number
  at: number
  size: number
  color?: string
  rotate?: number
  style?: React.CSSProperties
}> = ({ children, frame, at, size, color = C.fg, rotate = 0, style }) => {
  const t = frame - at
  if (t < 0) return null
  const p = pop(frame, { delay: at, damping: 13, stiffness: 190, mass: 0.75 })
  const blur = lerp(t, [0, 5], [18, 0], EASE.out)
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: DISPLAY,
        fontSize: size,
        lineHeight: 0.84,
        letterSpacing: size * 0.005,
        color,
        transform: `scale(${0.72 + p * 0.28}) rotate(${rotate}deg)`,
        filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
        opacity: Math.min(1, t / 2),
        ...style,
      }}
    >
      {children}
    </span>
  )
}

/** Le trait qui barre un mot. Il se trace, il n'apparait pas. */
export const Strike: React.FC<{
  frame: number
  at: number
  width: number
  thickness: number
  color?: string
  style?: React.CSSProperties
}> = ({ frame, at, width, thickness, color = C.pink, style }) => {
  const p = lerp(frame, [at, at + 9], [0, 1], EASE.out)
  if (p <= 0) return null
  return (
    <div
      style={{
        position: 'absolute',
        height: thickness,
        width: width * p,
        background: color,
        borderRadius: thickness,
        boxShadow: `0 0 ${thickness * 2}px ${color}aa`,
        ...style,
      }}
    />
  )
}

/**
 * Le libelle d'un plan : un numero, un titre, une ligne.
 * Toujours au meme endroit d'un format a l'autre — c'est ce qui tient le
 * montage quand tout le reste bouge.
 */
export const Caption: React.FC<{
  index: string
  title: string
  line: string
  tag?: string
  frame: number
  at: number
  u: number
  align?: 'left' | 'center'
  style?: React.CSSProperties
}> = ({ index, title, line, tag, frame, at, u, align = 'left', style }) => {
  const p = pop(frame, { delay: at, damping: 16, stiffness: 150 })
  const out = lerp(frame, [at + 50, at + 58], [0, 1], EASE.in)
  const items = align === 'center' ? 'center' : 'flex-start'
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: items,
        textAlign: align,
        opacity: p * (1 - out),
        transform: `translateY(${(1 - p) * 26 * u + out * -20 * u}px)`,
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 14 * u,
        }}
      >
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 18 * u,
            letterSpacing: 2 * u,
            color: C.primary,
          }}
        >
          {index}
        </span>
        <span
          style={{
            fontFamily: DISPLAY,
            fontSize: 74 * u,
            lineHeight: 0.9,
            color: C.fg,
            letterSpacing: 1 * u,
          }}
        >
          {title}
        </span>
      </div>
      <span
        style={{
          fontFamily: SANS,
          fontWeight: 500,
          fontSize: 25 * u,
          color: C.fg,
          marginTop: 8 * u,
        }}
      >
        {line}
      </span>
      {tag ? (
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 16 * u,
            color: C.primary,
            background: `${C.primary}1f`,
            border: `1px solid ${C.primary}44`,
            borderRadius: 999,
            padding: `${6 * u}px ${14 * u}px`,
            marginTop: 14 * u,
          }}
        >
          {tag}
        </span>
      ) : null}
    </div>
  )
}
