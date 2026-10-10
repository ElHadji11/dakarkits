import React from 'react'
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { EASE, burst, drift, lerp, pop } from '../components/anim'
import { Safe } from '../components/Safe'
import { Eyebrow, Kinetic } from '../components/Type'
import { DISPLAY, SANS } from '../fonts'
import { C } from '../theme'

/**
 * Plan 4 — la boutique sur un téléphone.
 *
 * Un seul appareil, et grand. Deux maquettes côte à côte tenaient dans le
 * cadre, mais plus rien ne s'y lisait : un maillot rendu à 60 px de large
 * n'existe pas sur l'écran de quelqu'un qui scrolle.
 *
 * Le plan se joue en deux temps : la grille défile, puis on « tape » sur une
 * carte et la fiche du Maroc s'ouvre en gros plan. C'est ce second temps qui
 * montre enfin un maillot.
 */
const PHONE_W = 420
/**
 * 16:9, le rapport de la capture produit (380 × 660 CSS, densité 2).
 *
 * Cette hauteur n'est pas un choix esthétique : 660 px est le cadre le plus
 * haut qui laisse voir le titre et le prix du maillot tout en coupant la
 * mention « en espèces », que la promo contredit. Vérifié par balayage sur le
 * site, pas estimé. Changer ce rapport sans reprendre la capture laisse une
 * bande vide sous l'écran — ou remet la mention à l'image.
 */
const PHONE_H = Math.round(PHONE_W * (1320 / 760))

/** Frame du plan où la fiche s'ouvre. */
const TAP = 46

const STATS = [
  { value: '30 S', label: 'Pour commander', lead: true },
  { value: '0', label: 'Compte à créer', lead: false },
  { value: '0 F', label: 'À payer avant livraison', lead: false },
]

export const Experience: React.FC = () => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()

  const exit = lerp(frame, [durationInFrames - 12, durationInFrames], [0, 1], EASE.in)
  const entry = pop(frame, { delay: 0, damping: 18, stiffness: 120 })

  // Le défilement démarre sous la barre de filtres, qui affiche le nombre de
  // maillots publiés, et s'arrête avant le pied de page.
  const scroll = lerp(frame, [2, TAP], [-430, -700], EASE.inOut)

  const opened = frame >= TAP
  const zoom = lerp(frame, [TAP, durationInFrames - 12], [1, 1.05], EASE.out)
  const tap = burst(frame, TAP, 8, 1)

  return (
    <AbsoluteFill
      style={{
        opacity: lerp(frame, [0, 4], [0, 1]) * (1 - exit),
        transform: `scale(${1 - exit * 0.09})`,
      }}
    >
      <Safe justify="flex-start">
        <div
          style={{
            width: PHONE_W,
            height: PHONE_H,
            borderRadius: 52,
            padding: 7,
            background: `linear-gradient(160deg, ${C.border}, ${C.bgDeep})`,
            boxShadow: `0 60px 110px -26px rgba(0,0,0,0.9), 0 0 0 1px ${C.border}, 0 0 90px -16px ${C.primary}66`,
            transform: `perspective(2000px) rotateY(${lerp(
              frame,
              [0, 30],
              [13, 4],
              EASE.out,
            )}deg) translateY(${
              (1 - entry) * 280 + drift(1, frame, 8, 0.018)
            }px) scale(${lerp(entry, [0, 1], [0.92, 1]) * (1 + tap * 0.03)})`,
            opacity: lerp(entry, [0, 0.25], [0, 1]),
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 46,
              overflow: 'hidden',
              background: C.bg,
              position: 'relative',
            }}
          >
            <Img
              src={staticFile('shop-home-full.png')}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: PHONE_W * (5352 / 800),
                objectFit: 'cover',
                objectPosition: 'top',
                transform: `translateY(${scroll}px)`,
                opacity: opened ? 0 : 1,
              }}
            />
            {/* La fiche produit : capture courte, elle tient pile dans le
                cadre. La faire défiler découvrirait le vide sous la page. */}
            <Img
              src={staticFile('shop-product-top.png')}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: PHONE_H,
                objectFit: 'cover',
                objectPosition: 'top',
                transform: `scale(${zoom})`,
                transformOrigin: '50% 45%',
                opacity: opened ? 1 : 0,
              }}
            />
            {/* L'éclat de la frappe reste dans l'écran : c'est l'app qui
                réagit, pas la caméra. */}
            <AbsoluteFill
              style={{ background: '#FFFFFF', opacity: tap * 0.5, mixBlendMode: 'screen' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(118deg, rgba(255,255,255,0.14) 0%, transparent 38%, transparent 70%, rgba(255,255,255,0.06) 100%)',
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Eyebrow
            text="Directement sur ton téléphone"
            frame={frame}
            delay={8}
            size={26}
            color={C.cyan}
            align="center"
          />
        </div>

        <div
          style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <Kinetic
            text="TOUT LE CATALOGUE"
            frame={frame}
            delay={12}
            stagger={0.5}
            size={80}
            tracking={-1}
          />
          <Kinetic
            text="EN UN CLIC"
            frame={frame}
            delay={19}
            stagger={0.5}
            size={80}
            tracking={-1}
            color={C.primary}
          />
        </div>

        <div
          style={{
            fontFamily: SANS,
            fontSize: 34,
            lineHeight: 1.36,
            color: C.fg,
            textAlign: 'center',
            maxWidth: 840,
            marginTop: 12,
            opacity: lerp(frame, [28, 40], [0, 1]),
            transform: `translateY(${lerp(frame, [28, 40], [18, 0], EASE.out)}px)`,
          }}
        >
          Choisis ton maillot, ta taille, et commande en 30 secondes chrono.
        </div>

        {/* Les trois chiffres sur une seule rangée : empilés, le dernier
            tombait dans la zone morte du bas. Le premier reste deux fois plus
            gros et violet — c'est celui qu'on doit retenir. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 44,
            marginTop: 18,
          }}
        >
          {STATS.map((s, i) => {
            const p = pop(frame, { delay: 44 + i * 6, damping: 13 })
            return (
              <div
                key={s.label}
                style={{
                  textAlign: 'center',
                  width: s.lead ? 300 : 230,
                  transform: `translateY(${(1 - p) * 30}px) scale(${lerp(
                    p,
                    [0, 1],
                    [s.lead ? 0.78 : 0.86, 1],
                  )})`,
                  opacity: lerp(p, [0, 0.4], [0, 1]),
                }}
              >
                {/* Boîte de hauteur fixe : le chiffre de tête est bien plus
                    grand, et sans elle les trois légendes s'échelonnent. */}
                <div
                  style={{
                    height: 118,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      fontFamily: DISPLAY,
                      fontSize: s.lead ? 132 : 72,
                      lineHeight: 0.86,
                      color: s.lead ? C.primary : C.fg,
                      textShadow: s.lead ? `0 0 60px ${C.primary}66` : undefined,
                    }}
                  >
                    {s.value}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: SANS,
                    fontWeight: s.lead ? 600 : 400,
                    fontSize: s.lead ? 25 : 21,
                    color: s.lead ? C.fg : C.muted,
                    textTransform: 'uppercase',
                    letterSpacing: 2.5,
                    marginTop: 8,
                    lineHeight: 1.25,
                  }}
                >
                  {s.label}
                </div>
              </div>
            )
          })}
        </div>
      </Safe>
    </AbsoluteFill>
  )
}
