import React from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { EASE, lerp, pop } from '../../components/anim'
import { DISPLAY, SANS } from '../../fonts'
import { C, SAFE } from '../../theme'
import { Mascot, mascotEntrance } from '../Mascot'
import { VO_AT } from '../timeline'
import { VO } from '../vo-envelope'

/**
 * Accroche A — le lion ouvre le film.
 *
 * Deux secondes, une mesure. Il tient le cadre seul, il parle, et il annonce
 * la seule chose qui fasse arreter un pouce : une question. Le reste du film
 * y repond.
 *
 * **Pas de logo ici non plus.** La marque reste pour le carton de fin ; ce
 * plan-ci ne montre qu'un personnage et une phrase. Le lion porte un maillot
 * uni, sans ecusson — il dit « maillots » sans rien revendiquer.
 *
 * Le texte est pose **haut**, au-dessus de sa tete : c'est la seule zone du
 * cadre qu'il ne remplit pas, et elle est au-dessus des 350 px du bas que
 * l'interface de TikTok recouvre.
 *
 * ---
 *
 * C'est l'accroche d'origine, et elle a une faiblesse que les deux autres
 * corrigent : **elle fait attendre le produit de deux secondes.** Un lion
 * dessine est sympathique, il n'est pas une raison d'acheter. `Shock.tsx`
 * ouvre sur un maillot et un montant, et laisse le lion signer a la fin.
 */

/**
 * Les deux lignes reprennent **mot pour mot** le debut de la voix off. Un
 * texte qui dit autre chose que ce qu'on entend force a lire et a ecouter
 * deux choses a la fois, et on ne retient ni l'une ni l'autre — alors que la
 * meme phrase lue et entendue ensemble s'imprime deux fois.
 */
const COPY = {
  title: 'TON MAILLOT',
  line: 'Livré à Dakar. Payé à la livraison.',
} as const

export const LionHook: React.FC = () => {
  const frame = useCurrentFrame()

  const enter = mascotEntrance(frame, 0, 14)
  const title = pop(frame, { delay: 6, damping: 15, stiffness: 160 })

  // La sortie est un simple effacement : la coupe vers le premier maillot
  // tombe sur un kick, et c'est elle qui doit s'entendre, pas un mouvement.
  const out = lerp(frame, [52, 60], [0, 1], EASE.in)

  return (
    <AbsoluteFill style={{ background: C.bgDeep }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(84% 46% at 50% 62%, ${C.card} 0%, ${C.bg} 44%, ${C.bgDeep} 84%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(52% 30% at 50% 64%, ${C.primaryDeep}55 0%, transparent 74%)`,
          opacity: lerp(frame, [0, 14], [0.4, 1]),
        }}
      />

      <AbsoluteFill style={{ opacity: 1 - out }}>
        {/*
         * Le lion est cadre a la taille et déborde par le bas : un personnage
         * pose en entier au milieu d'un 9:16 est petit, et il flotte. Coupe
         * par le bord, il est dans le cadre et pas dessus.
         */}
        <Mascot
          height={1430}
          bottom={-90}
          centerX={540}
          frame={frame}
          entrance={enter}
          voiceFrame={frame - VO_AT}
          voice={VO.lion.env}
        />

        <div
          style={{
            position: 'absolute',
            left: 70,
            right: 70,
            top: SAFE.top - 40,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            transform: `translateY(${(1 - title) * 34}px)`,
            opacity: title,
          }}
        >
          <span
            style={{
              fontFamily: DISPLAY,
              fontSize: 128,
              lineHeight: 0.92,
              color: C.fg,
              letterSpacing: 1,
            }}
          >
            {COPY.title}
          </span>
          <span
            style={{
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: 42,
              lineHeight: 1.3,
              color: C.primary,
              marginTop: 18,
            }}
          >
            {COPY.line}
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
