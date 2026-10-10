import React from 'react'
import { DISPLAY } from '../fonts'
import { C } from '../theme'
import { pop } from './anim'

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

type Props = {
  /** Le montant ou le compte à afficher, déjà formaté (« 8 000 », « 13 »). */
  value: string
  frame: number
  delay?: number
  size: number
  color?: string
  /** Décalage de départ de chaque roue, en frames. */
  stagger?: number
  /** Nombre de tours avant de s'arrêter sur le bon chiffre. */
  spins?: number
  style?: React.CSSProperties
}

/**
 * Compteur à rouleaux. Chaque chiffre est une colonne 0-9 qui défile et
 * s'arrête sur sa valeur, en ressort — l'arrêt doit dépasser légèrement, sinon
 * le mouvement a l'air d'un simple fondu.
 *
 * Les espaces des milliers ne tournent pas : ce sont des colonnes fixes.
 */
export const Odometer: React.FC<Props> = ({
  value,
  frame,
  delay = 0,
  size,
  color = C.fg,
  stagger = 2.5,
  spins = 2,
  style,
}) => {
  const cell = size * 0.84
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', ...style }}>
      {value.split('').map((char, i) => {
        if (!/\d/.test(char)) {
          return (
            <span
              key={`sep-${i}`}
              style={{
                fontFamily: DISPLAY,
                fontSize: size,
                lineHeight: `${cell}px`,
                color,
                width: char === ' ' ? size * 0.22 : undefined,
                display: 'inline-block',
              }}
            >
              {char === ' ' ? '' : char}
            </span>
          )
        }
        const target = Number(char)
        // Ressort sec : la roue doit etre posee en une vingtaine de
        // frames, sinon le montant n'est lisible qu'a la fin du plan.
        const p = pop(frame, {
          delay: delay + i * stagger,
          damping: 20,
          stiffness: 160,
          mass: 0.8,
        })
        const travel = (spins * 10 + target) * cell
        return (
          <div
            key={`d-${i}`}
            style={{
              height: cell,
              overflow: 'hidden',
              // Chaque roue garde sa largeur propre : les chiffres de Bebas ne
              // sont pas tabulaires, et une largeur figée les écarterait.
              display: 'inline-block',
            }}
          >
            <div style={{ transform: `translateY(${-p * travel}px)` }}>
              {/* Dix cellules de rab : le dépassement du ressort ne doit
                  jamais révéler le bas de la colonne. */}
              {new Array(spins * 10 + 20).fill(0).map((_, k) => (
                <div
                  key={k}
                  style={{
                    height: cell,
                    lineHeight: `${cell}px`,
                    fontFamily: DISPLAY,
                    fontSize: size,
                    color,
                    textAlign: 'center',
                  }}
                >
                  {DIGITS[k % 10]}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
