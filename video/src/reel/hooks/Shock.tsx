import React from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { EASE, lerp, pop } from '../../components/anim'
import { DISPLAY, SANS } from '../../fonts'
import { Slam } from '../../spot/Type'
import { C, SAFE } from '../../theme'
import { LitBackdrop, LitJersey } from '../Lit'
import { HERO } from '../timeline'

/**
 * Accroches B et C — le choc du prix.
 *
 * Les deux ouvrent sur **un montant**, et c'est tout ce qu'elles ont a dire
 * en deux secondes. Elles corrigent le defaut de l'accroche au lion
 * (`Lion.tsx`), qui fait attendre le produit : personne ne connait
 * DakarKits, personne n'attend sa mascotte, et le seul argument qui arrete un
 * pouce a Dakar est un maillot de club a sept mille cinq cents francs.
 *
 *  - **B, `PriceHook`** : le maillot claque dans le cadre et le prix se pose
 *    dessus. Aucun contexte, aucune comparaison, aucune marque — un produit
 *    et un montant. C'est la version qui ne dit rien de personne d'autre.
 *  - **C, `MarketHook`** : le montant qu'on paie ailleurs, barre, puis le
 *    notre. Elle vise ceux qui ont deja paye trop cher au marche, et elle
 *    frappe plus fort — mais les quinze mille francs sont **une affirmation
 *    du brief, pas un prix releve**, contrairement a tous les autres montants
 *    du film qui sortent des captures du site. Elle est ecrite comme une
 *    phrase a la deuxieme personne (« arrete de payer »), jamais comme un
 *    tarif attribue a un concurrent nomme, et le 15 000 n'est jamais barre
 *    *a cote* du notre comme le serait un ancien prix DakarKits : il vit dans
 *    son propre temps, avant que le maillot arrive.
 *
 * ---
 *
 * **Le prix passe par-dessus le maillot, ici et nulle part ailleurs.**
 *
 * La regle de `Lit.tsx` dit l'inverse : rien ne passe sur un maillot, le
 * texte se range dans les bandes libres. Elle vaut pour la parade, ou le
 * sujet est le produit. Dans ces deux plans-ci le sujet est **le montant** ;
 * le maillot dit seulement de quoi on parle. Un voile sombre monte du bas du
 * cadre pour donner un sol au nombre — c'est le seul endroit du film ou une
 * photo de maillot est assombrie, et c'est parce qu'elle n'y est pas le
 * produit mais le decor.
 *
 * Les deux plans font **exactement 60 frames**, comme celui du lion : une
 * mesure a 120 BPM. Changer d'accroche ne doit jamais decaler une seule
 * coupe du reste du film.
 */

/** Le maillot des deux accroches : celui sur lequel le film finira par taper « barca ». */
const JERSEY = HERO.jersey
const HALO = HERO.halo

/* --------------------------------------------------------------- briques */

/**
 * Le montant, en grand, et d'un bloc.
 *
 * Le nombre et son unite tiennent dans **un seul enfant du flex** parent
 * quand ils sont alignes a la ligne de base : sortir l'unite dans son propre
 * element ajouterait la gouttiere du flex entre les deux. C'est le piege paye
 * sur la fiche produit le 2026-10-07 (`../../AGENTS.md`), et il se repose a
 * l'identique ici.
 */
const Amount: React.FC<{
  value: string
  size: number
  color?: string
  unit?: string
  glow?: number
  style?: React.CSSProperties
}> = ({ value, size, color = C.fg, unit = 'F', glow = 0, style }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'baseline',
      justifyContent: 'center',
      gap: size * 0.07,
      fontFamily: DISPLAY,
      lineHeight: 0.82,
      color,
      textShadow: glow > 0 ? `0 0 ${glow}px ${C.primary}AA, 0 0 ${glow * 2.4}px ${C.primary}55` : undefined,
      ...style,
    }}
  >
    <span style={{ fontSize: size }}>{value}</span>
    <span style={{ fontSize: size * 0.52, color: glow > 0 ? C.primary : color }}>{unit}</span>
  </span>
)

/**
 * Le maillot qui claque.
 *
 * Il n'entre pas par le cote comme ceux de la parade : il **tombe sur le
 * spectateur**. L'echelle part a 1,4 et le flou se resorbe en six frames —
 * c'est le flou qui fait la claque, pas le ressort, exactement comme pour un
 * mot de `Slam`.
 */
const Slap: React.FC<{ frame: number; at: number; box: { w: number; h: number }; top: number }> = ({
  frame,
  at,
  box,
  top,
}) => {
  const t = frame - at
  if (t < -1) return null
  const p = pop(frame, { delay: at, damping: 13, stiffness: 190, mass: 0.8 })
  const blur = lerp(t, [0, 6], [38, 0], EASE.out)
  // Une derive lente apres la claque : un maillot parfaitement immobile se
  // relit comme une image fixe des la deuxieme seconde.
  const settle = lerp(t, [8, 60], [1, 1.035], EASE.out)
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top,
        transform: `translateX(-50%) scale(${(0.72 + p * 0.28) * 1.08 * settle})`,
        filter: blur > 0.4 ? `blur(${blur}px)` : undefined,
        opacity: Math.min(1, (t + 1) / 2),
      }}
    >
      <LitJersey jersey={JERSEY} box={box} halo={HALO} power={p} />
    </div>
  )
}

/**
 * Le sol du nombre : un voile qui monte du bas et eteint le bas du maillot.
 *
 * Sans lui, le montant se pose sur les plis et les couleurs du maillot et
 * perd son contour — a 300 px de haut, un chiffre a moitie lisible est pire
 * qu'un chiffre plus petit.
 */
const Veil: React.FC<{ from: number; opacity: number }> = ({ from, opacity }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(180deg, transparent ${from}%, ${C.bgDeep}D9 ${from + 16}%, ${C.bgDeep} 100%)`,
      opacity,
    }}
  />
)

/** La ligne de promesse, commune aux deux accroches. */
const Tagline: React.FC<{ frame: number; at: number; top: number }> = ({ frame, at, top }) => {
  const p = pop(frame, { delay: at, damping: 15, stiffness: 160 })
  if (p <= 0.001) return null
  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        top,
        textAlign: 'center',
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: 46,
        color: C.primary,
        opacity: lerp(p, [0, 0.4], [0, 1]),
        transform: `translateY(${(1 - p) * 22}px)`,
      }}
    >
      Livré chez toi.
    </div>
  )
}

/* ------------------------------------------------- B · le prix tout court */

/**
 * « 7 500 F. Le maillot du Barça. Livré chez toi. »
 *
 * Le montant est celui de la fiche produit, releve a la capture — comme tous
 * les autres du film. Le maillot est le meme que celui que la parade garde
 * pour la fin et que la recherche ira chercher avec « barca » : le
 * spectateur l'aura donc vu trois fois quand le formulaire se remplira, ce
 * qui est exactement le nombre de fois qu'il faut pour qu'un produit
 * inconnu devienne familier.
 */
export const PriceHook: React.FC = () => {
  const frame = useCurrentFrame()
  const out = lerp(frame, [53, 60], [0, 1], EASE.in)

  return (
    <AbsoluteFill style={{ background: C.bgDeep, opacity: 1 - out }}>
      <LitBackdrop halo={HALO} power={lerp(frame, [0, 10], [0.4, 1], EASE.out)} />

      <Slap frame={frame} at={0} box={{ w: 1020, h: 1000 }} top={SAFE.top - 25} />
      <Veil from={44} opacity={lerp(frame, [1, 7], [0, 1])} />

      {/* Le montant. Il tombe deux frames apres le maillot : assez pour qu'on
          ait vu arriver le produit, pas assez pour que ce soit deux gestes. */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1035 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Slam frame={frame} at={2} size={306} style={{ lineHeight: 0.82 }}>
            <Amount value="7 500" size={306} glow={70} />
          </Slam>
        </div>
      </div>

      {/* Et seulement ensuite, de quel maillot il s'agit. */}
      <div
        style={{
          position: 'absolute',
          left: 50,
          right: 50,
          top: 1338,
          textAlign: 'center',
          fontFamily: DISPLAY,
          fontSize: 96,
          lineHeight: 1,
          color: C.fg,
          letterSpacing: lerp(frame, [16, 34], [18, 6], EASE.out),
          // La chasse de fin de mot decentre la ligne si on ne la rattrape pas.
          transform: `translateX(${lerp(frame, [16, 34], [9, 3], EASE.out)}px) translateY(${lerp(
            frame,
            [16, 28],
            [26, 0],
            EASE.out,
          )}px)`,
          opacity: lerp(frame, [16, 24], [0, 1]),
        }}
      >
        LE MAILLOT DU BARÇA
      </div>

      <Tagline frame={frame} at={32} top={1456} />
    </AbsoluteFill>
  )
}

/* ------------------------------------------- C · ce que tu paies ailleurs */

/** La frame ou le plan bascule : le vieux montant part, le maillot arrive. */
const TURN = 20

/**
 * « Arrête de payer ton maillot 15 000 F. »
 *
 * Deux temps dans une mesure. D'abord le montant seul sur fond noir, barre
 * net — c'est la somme que le spectateur a deja laissee au marche, et le plan
 * ne dit rien d'autre pendant vingt frames. Puis il recule, retreci et
 * toujours barre, pendant que le maillot claque et que le vrai prix prend sa
 * place.
 *
 * Le barre ne disparait pas : c'est la comparaison qui porte l'accroche, et
 * une comparaison dont un terme s'efface n'en est plus une.
 */
export const MarketHook: React.FC = () => {
  const frame = useCurrentFrame()
  const out = lerp(frame, [53, 60], [0, 1], EASE.in)

  /** La bascule. Elle commande la taille et la place du montant barre. */
  const turn = lerp(frame, [TURN, TURN + 9], [0, 1], EASE.inOut)

  const oldSize = lerp(turn, [0, 1], [272, 98])
  const oldTop = lerp(turn, [0, 1], [820, 282])
  const strike = lerp(frame, [12, 20], [0, 1], EASE.out)

  return (
    <AbsoluteFill style={{ background: C.bgDeep, opacity: 1 - out }}>
      <LitBackdrop halo={HALO} power={turn} />

      <Slap frame={frame} at={TURN} box={{ w: 900, h: 900 }} top={392} />
      <Veil from={48} opacity={lerp(frame, [TURN + 1, TURN + 7], [0, 1])} />

      {/* « ARRÊTE DE PAYER » — elle ne vit que le temps du premier montant. */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          top: 690,
          textAlign: 'center',
          fontFamily: DISPLAY,
          fontSize: 104,
          lineHeight: 1,
          color: C.muted,
          letterSpacing: 10,
          transform: 'translateX(5px)',
          opacity: lerp(frame, [2, 8], [0, 1]) * (1 - turn),
        }}
      >
        ARRÊTE DE PAYER
      </div>

      {/* Le montant du marche, barre. Il recule sans jamais sortir du cadre. */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: oldTop }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {/* Une fois recule, il s'eteint un peu : les deux montants sont a
              l'ecran en meme temps, et c'est le notre qui doit se lire en
              premier. Il ne s'efface pas pour autant — une comparaison dont
              un terme disparait n'en est plus une. */}
          <div style={{ position: 'relative', opacity: lerp(turn, [0, 1], [1, 0.74]) }}>
            <Slam frame={frame} at={0} size={oldSize} style={{ lineHeight: 0.82 }}>
              <Amount value="15 000" size={oldSize} />
            </Slam>
            {/* Le trait se trace, il n'apparait pas. Il suit la taille du
                montant pendant que celui-ci recule. */}
            <div
              style={{
                position: 'absolute',
                left: '-3%',
                top: '46%',
                height: Math.max(5, oldSize * 0.045),
                width: `${106 * strike}%`,
                background: C.pink,
                borderRadius: 999,
                boxShadow: `0 0 ${oldSize * 0.14}px ${C.pink}CC`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Le notre. Il arrive avec le maillot, pas avant. */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1178 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Slam frame={frame} at={TURN + 3} size={274} style={{ lineHeight: 0.82 }}>
            <Amount value="7 500" size={274} glow={70} />
          </Slam>
        </div>
      </div>

      <Tagline frame={frame} at={TURN + 20} top={1452} />
    </AbsoluteFill>
  )
}
