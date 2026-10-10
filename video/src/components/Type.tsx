import React from 'react'
import { DISPLAY, SANS } from '../fonts'
import { C } from '../theme'
import { lerp, pop } from './anim'

type KineticProps = {
  text: string
  frame: number
  delay?: number
  /** Retard ajouté par caractère. Sous 1, les lettres se chevauchent. */
  stagger?: number
  size?: number
  color?: string
  tracking?: number
  font?: string
  weight?: number
  /** Hauteur de la fenêtre de masquage, en multiples de la taille de police. */
  lineHeight?: number
  style?: React.CSSProperties
}

/**
 * Titre cinétique : chaque lettre monte derrière un masque, avec un ressort
 * décalé. Les espaces ne portent pas de délai, sinon la phrase traîne.
 */
export const Kinetic: React.FC<KineticProps> = ({
  text,
  frame,
  delay = 0,
  stagger = 1.6,
  size = 120,
  color = C.fg,
  tracking = 0,
  font = DISPLAY,
  weight = 400,
  lineHeight = 1,
  style,
}) => (
  <div style={{ display: 'flex', overflow: 'hidden', paddingBottom: size * 0.08, ...style }}>
    {text.split('').map((char, i) => {
      const p = pop(frame, { delay: delay + i * stagger, damping: 16, stiffness: 160 })
      return (
        <span
          key={`${char}-${i}`}
          style={{
            display: 'inline-block',
            fontFamily: font,
            fontWeight: weight,
            fontSize: size,
            lineHeight,
            color,
            letterSpacing: tracking,
            whiteSpace: 'pre',
            transform: `translateY(${(1 - p) * size * 1.15}px) rotate(${(1 - p) * -6}deg)`,
            opacity: lerp(p, [0, 0.35], [0, 1]),
          }}
        >
          {char}
        </span>
      )
    })}
  </div>
)

/**
 * Surtitre : petites capitales Inter, très espacées, qui se resserrent en
 * entrant. L'interlettrage fait tout le travail.
 */
export const Eyebrow: React.FC<{
  text: string
  frame: number
  delay?: number
  size?: number
  color?: string
  align?: React.CSSProperties['justifyContent']
}> = ({ text, frame, delay = 0, size = 22, color = C.muted, align }) => {
  const p = pop(frame, { delay, damping: 200, mass: 0.9 })
  const spacing = lerp(p, [0, 1], [size * 0.9, size * 0.28])
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: align,
        // L'interlettrage ajoute une chasse après la dernière lettre : centré,
        // le mot paraît décalé vers la gauche de la moitié de cette valeur.
        transform: align === 'center' ? `translateX(${spacing / 2}px)` : undefined,
        fontFamily: SANS,
        fontWeight: 500,
        fontSize: size,
        color,
        textTransform: 'uppercase',
        letterSpacing: spacing,
        opacity: lerp(p, [0, 0.4], [0, 1]),
        whiteSpace: 'pre',
      }}
    >
      {text}
    </div>
  )
}

/** Trait qui se trace. Sépare un surtitre de son titre. */
export const Rule: React.FC<{
  progress: number
  width: number
  color?: string
  thickness?: number
}> = ({ progress, width, color = C.primary, thickness = 3 }) => (
  <div
    style={{
      width: width * Math.min(1, Math.max(0, progress)),
      height: thickness,
      background: `linear-gradient(90deg, ${color}, ${color}00)`,
      boxShadow: `0 0 18px ${color}99`,
    }}
  />
)

/**
 * Reflet qui traverse un bloc de texte. Un masque en dégradé sur une copie
 * blanche du contenu : moins coûteux qu'un filtre, et ça se place à la frame.
 */
export const Sheen: React.FC<{ progress: number; children: React.ReactNode }> = ({
  progress,
  children,
}) => {
  const visible = progress > 0 && progress < 1
  return (
    <div style={{ position: 'relative' }}>
      {children}
      {visible ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            // Le contenu dupliqué porte ses propres couleurs : on le blanchit
            // au filtre plutôt que par héritage, qui ne l'atteindrait pas.
            filter: 'brightness(2.8) saturate(0.15)',
            mixBlendMode: 'screen',
            opacity: 0.9,
            maskImage: `linear-gradient(105deg, transparent ${progress * 160 - 40}%, #000 ${
              progress * 160 - 14
            }%, #000 ${progress * 160}%, transparent ${progress * 160 + 24}%)`,
            WebkitMaskImage: `linear-gradient(105deg, transparent ${progress * 160 - 40}%, #000 ${
              progress * 160 - 14
            }%, #000 ${progress * 160}%, transparent ${progress * 160 + 24}%)`,
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}
