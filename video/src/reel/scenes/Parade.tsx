import React from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { EASE, drift, lerp, pop } from '../../components/anim'
import { Odometer } from '../../components/Odometer'
import { Sheen } from '../../components/Type'
import { DISPLAY, SANS } from '../../fonts'
import { C, discount, money } from '../../theme'
import { LitBackdrop, LitJersey } from '../Lit'
import { COPY, OFFER_AT, PARADE, len, type ParadeShot } from '../timeline'

/**
 * Plan 1 — cinq secondes de maillots, et rien d'autre.
 *
 * Les deux premieres secondes decident de tout : personne ne connait
 * DakarKits, donc la frame 0 ne porte **ni logo ni nom de marque**, seulement
 * un maillot en grand et son prix. Le monogramme attend le carton de fin,
 * ou il a enfin une raison d'etre la.
 *
 * Trois maillots se succedent au fouette, un par mesure et demie. Le dernier
 * tient deux secondes de plus : c'est sur lui que l'offre se pose, et c'est
 * le Barca — le plan suivant tape « barca » dans la recherche du site.
 */

const DUR = len('parade')
/** Entree et sortie d'un maillot, en frames. Au-dela, ce n'est plus un fouette. */
const WHIP = 11

/**
 * La mise en page d'un plan, en trois bandes qui ne se touchent jamais.
 *
 * La bande utile du format vertical va de 250 a 1570 : au-dessus et en
 * dessous, l'interface de TikTok et des Reels recouvre l'image. Les trois
 * bandes ci-dessous la remplissent sans se chevaucher, et c'est **une boite
 * de hauteur fixe** pour le maillot qui le garantit — pas une largeur, qui
 * laisserait chaque photo descendre ou bon lui semble.
 */
const BANDS = {
  /** Le nom de l'equipe, ou l'offre sur le troisieme plan. */
  label: 256,
  /** Le maillot : 340 → 1240. */
  jersey: { top: 340, w: 880, h: 900 },
  /** Le prix : le bas du bloc, mesure depuis le bas du cadre. */
  priceBottom: 370,
} as const

/**
 * Le creneau d'un maillot : du sien jusqu'a l'entree du suivant.
 *
 * `end` est donc **la frame d'entree du suivant**, et non la frame ou
 * celui-ci doit avoir disparu. Voir `shotAt` : la sortie commence a `end`,
 * elle ne s'y termine pas.
 */
const slot = (i: number) => {
  const start = PARADE[i].at
  const end = i + 1 < PARADE.length ? PARADE[i + 1].at : DUR
  return { start, end }
}

/**
 * L'etat d'un maillot a une frame donnee.
 *
 * ---
 *
 * **Le trou noir de la quatrieme seconde.**
 *
 * Le premier montage faisait sortir un maillot sur les onze frames *avant*
 * l'entree du suivant : `outP` courait sur `[end - WHIP, end]` et le suivant
 * ne commencait son entree qu'a `end`. Les deux mouvements se suivaient au
 * lieu de se croiser, et entre les deux il restait **une demi-seconde de
 * cadre vide** — mesuree sur le rendu, le Maroc avait disparu et le Barca
 * n'etait pas encore la. Dans une publicite de vingt-deux secondes, c'est
 * exactement la que le pouce part.
 *
 * Ici la sortie court sur `[end, end + WHIP]`, donc **pendant** l'entree du
 * suivant. Les deux maillots sont a l'ecran en meme temps et se croisent :
 * il n'y a plus de frame sans produit.
 *
 * Pour que ca se lise comme un seul mouvement et non comme deux cartons qui
 * se percutent, le sortant part **dans la direction ou voyage l'entrant**.
 * Un maillot qui entre avec `dir = 1` part de +1 250 et va vers la gauche ;
 * le sortant quitte donc le cadre par la gauche lui aussi. D'ou
 * `-PARADE[i + 1].dir` et pas `-dir` : c'est le sens de l'entrant qui
 * commande, pas le sien.
 */
const shotAt = (i: number, frame: number) => {
  const { start, end } = slot(i)
  const first = i === 0
  const last = i === PARADE.length - 1
  const next = PARADE[i + 1]

  /** La frame ou le maillot a fini de quitter le cadre. */
  const gone = last ? Infinity : end + WHIP
  const live = frame >= start - 1 && frame <= gone

  /*
   * **Le premier maillot n'entre pas : il est deja la.**
   *
   * Les autres sont lances depuis le hors-champ et freinent net — c'est le
   * fouette, et la trainee est un flou directionnel simule, parce qu'a cette
   * vitesse un maillot net qui glisse se lit comme un carton qui glisse.
   *
   * Appliquer la meme entree au premier donne une frame 0 vide : le maillot
   * est encore a 1 250 px hors du cadre et le spectateur ouvre le film sur du
   * noir. Sur un fil, une premiere image vide est une image perdue. Son
   * mouvement a lui est donc un appui — un leger sur-cadre qui se resorbe —
   * jamais une apparition.
   */
  /*
   * **Les deux maillots partagent la meme courbe, et c'est ce qui en fait un
   * fouette plutot qu'un empilement.**
   *
   * La sortie a d'abord ete ecrite en `EASE.in` — ce qui sort du cadre
   * accelere, c'est la regle du projet. Mais l'entree, elle, est en
   * `EASE.out` : a la cinquieme frame du croisement le Barca etait deja
   * arrive a 90 % et le Maroc n'avait bouge que de cent pixels. On ne voyait
   * pas deux maillots se croiser, on voyait le second tomber **sur** le
   * premier, badge de remise compris.
   *
   * Avec la meme courbe des deux cotes, les deux restent a 1 250 px l'un de
   * l'autre d'un bout a l'autre du geste : c'est une bande de deux maillots
   * que la camera balaie, et c'est exactement ce qu'un fouette est.
   */
  const inP = first ? 1 : lerp(frame, [start, start + WHIP], [0, 1], EASE.out)
  const outP = last ? 0 : lerp(frame, [end, end + WHIP], [0, 1], EASE.out)

  const x = (1 - inP) * PARADE[i].dir * 1250 - outP * (next ? next.dir : 1) * 1250
  const blur = (1 - inP) * 26 + outP * 26

  /** La puissance du halo : elle monte a l'entree et meurt avec la sortie. */
  const power = (first ? 1 : lerp(inP, [0, 0.45], [0, 1])) * (1 - outP)

  return { start, end, first, last, live, inP, outP, x, blur, power }
}

type ShotState = ReturnType<typeof shotAt>

/**
 * Le fond d'un plan, pose **sous tous les maillots**.
 *
 * Il se remplit a l'entree et ne s'efface jamais : c'est celui du plan
 * suivant qui le recouvre. Sans ca, un fond qui part avec son maillot
 * rouvrirait le trou noir qu'on vient de boucher — en plein milieu du
 * croisement, les deux fonds seraient a demi transparents sur du vide.
 */
const Back: React.FC<{ shot: ParadeShot; s: ShotState }> = ({ shot, s }) => (
  <AbsoluteFill style={{ opacity: s.first ? 1 : lerp(s.inP, [0, 0.5], [0, 1]) }}>
    <LitBackdrop halo={shot.halo} power={Math.max(s.power, s.inP * 0.5)} />
  </AbsoluteFill>
)

/**
 * Le maillot, son nom et son prix — la couche qui bouge.
 *
 * Elle est montee **apres tous les fonds**, jamais a cote du sien : pendant
 * le croisement, le fond de l'entrant passerait sinon par-dessus le maillot
 * du sortant et le couperait net au lieu de le laisser filer.
 */
const Front: React.FC<{ shot: ParadeShot; i: number; s: ShotState; frame: number }> = ({
  shot,
  i,
  s,
  frame,
}) => {
  const { start, end, first, last, outP, x, blur, power } = s
  const t = frame - start
  const { jersey, halo, label } = shot
  const off = discount(jersey)

  // Une fois pose, le maillot ne s'immobilise pas tout a fait : une derive
  // lente et un lent rapproche. L'image fixe trahit le montage.
  const settle = first
    ? lerp(t, [0, 16], [1.07, 1], EASE.out) * lerp(t, [16, end - start], [1, 1.03], EASE.out)
    : lerp(t, [WHIP, end - start], [1, 1.045], EASE.out)
  const float = drift(i + 7, frame, 9, 0.015)

  /*
   * Le texte part avant le maillot, et il part sur place.
   *
   * Pendant le croisement, deux noms d'equipe et deux prix sont dans les
   * memes bandes — si les deux jeux se chevauchaient, aucun des quatre ne se
   * lirait. Le sortant s'efface donc sur les six frames **qui precedent** le
   * fouette, et l'entrant n'ecrit le sien qu'une fois pose. Les bandes ne
   * portent jamais deux textes a la fois.
   */
  const textOut = last ? 0 : lerp(frame, [end - 4, end + 3], [0, 1], EASE.in)

  return (
    <AbsoluteFill>
      {/* Le nom de l'equipe, au-dessus du maillot, dans la bande haute. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: BANDS.label,
          textAlign: 'center',
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 44,
          letterSpacing: lerp(t, [2, 22], [26, 11], EASE.out),
          color: C.fg,
          textTransform: 'uppercase',
          // Sur le troisieme plan, l'offre prend la place du nom : les deux
          // vivent dans la meme bande, et deux lignes superposees ne se
          // liraient ni l'une ni l'autre. Le nom a deja fait son travail.
          // Le premier plan ne fait pas attendre son texte non plus.
          opacity:
            (first ? lerp(t, [0, 6], [0, 1]) : lerp(t, [2, 12], [0, 1])) *
            (last ? lerp(frame, [OFFER_AT - 8, OFFER_AT - 2], [1, 0]) : 1) *
            (1 - textOut),
          transform: `translateY(${lerp(t, [2, 16], [-26, 0], EASE.out)}px)`,
        }}
      >
        {label}
      </div>

      {/* Le maillot. Plein cadre, lumineux, et rien par-dessus. */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: BANDS.jersey.top,
          transform: `translateX(-50%) translate(${x}px, ${float}px) scale(${settle})`,
          filter: blur > 0.4 ? `blur(${blur}px)` : undefined,
        }}
      >
        <div style={{ position: 'relative' }}>
          <LitJersey
            jersey={jersey}
            box={{ w: BANDS.jersey.w, h: BANDS.jersey.h }}
            halo={halo}
            power={power}
          />

          {off ? (
            <div
              style={{
                position: 'absolute',
                top: 54,
                right: -18,
                background: C.primary,
                color: C.bg,
                fontFamily: SANS,
                fontWeight: 800,
                fontSize: 52,
                padding: '12px 30px',
                borderRadius: 999,
                boxShadow: `0 0 60px ${C.primary}77`,
                opacity: 1 - outP,
                transform: `rotate(9deg) scale(${pop(frame, {
                  delay: start + 7,
                  damping: 10,
                  stiffness: 170,
                })})`,
              }}
            >
              -{off} %
            </div>
          ) : null}
        </div>
      </div>

      {/* Le prix, dans la bande basse. L'ancien montant barre d'abord, le
          nouveau ensuite : c'est l'ecart qui fait l'offre. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: BANDS.priceBottom,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: (first ? lerp(t, [0, 8], [0, 1]) : lerp(t, [4, 13], [0, 1])) * (1 - textOut),
        }}
      >
        {jersey.was ? (
          <div style={{ position: 'relative', marginBottom: 2 }}>
            <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 40, color: C.muted }}>
              {money(jersey.was)}
            </span>
            <div
              style={{
                position: 'absolute',
                left: -4,
                top: '52%',
                height: 4,
                width: `${lerp(t, [8, 18], [0, 108], EASE.out)}%`,
                background: C.pink,
                boxShadow: `0 0 16px ${C.pink}`,
              }}
            />
          </div>
        ) : null}

        <Sheen progress={lerp(t, [12, 34], [0, 1])}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
            <Odometer
              value={String(jersey.price).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
              frame={frame}
              delay={start + 4}
              size={176}
              stagger={1.6}
              spins={1}
              color={C.fg}
            />
            <span
              style={{
                fontFamily: DISPLAY,
                fontSize: 104,
                lineHeight: 1,
                color: C.primary,
                paddingBottom: 14,
                textShadow: `0 0 46px ${C.primary}88`,
                opacity: lerp(t, [10, 18], [0, 1]),
              }}
            >
              F CFA
            </span>
          </div>
        </Sheen>
      </div>
    </AbsoluteFill>
  )
}

/**
 * L'offre, posee sur le troisieme maillot.
 *
 * Elle arrive seulement maintenant : trois maillots et trois prix ont deja
 * dit ce que vend la boutique, la phrase ne fait que donner l'echelle. Le
 * nombre vient de la capture du site, jamais d'une constante ecrite ici.
 */
const Offer: React.FC<{ frame: number }> = ({ frame }) => {
  const p = pop(frame, { delay: OFFER_AT, damping: 15, stiffness: 160 })
  if (p <= 0.001) return null
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: BANDS.label - 22,
        display: 'flex',
        justifyContent: 'center',
        opacity: lerp(p, [0, 0.4], [0, 1]),
        transform: `translateY(${(1 - p) * -24}px)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 16,
          padding: '14px 40px',
          borderRadius: 999,
          background: `${C.bgDeep}D9`,
          border: `2px solid ${C.primary}`,
          boxShadow: `0 0 54px ${C.primary}55`,
        }}
      >
        <span style={{ fontFamily: DISPLAY, fontSize: 74, lineHeight: 1, color: C.fg }}>
          {COPY.count} MAILLOTS
        </span>
        <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, color: C.muted }}>
          dès
        </span>
        <span style={{ fontFamily: DISPLAY, fontSize: 74, lineHeight: 1, color: C.primary }}>
          {COPY.from} F
        </span>
      </div>
    </div>
  )
}

/**
 * Les fonds d'abord, les maillots ensuite.
 *
 * Deux passes et non une par maillot : c'est ce qui permet au sortant et a
 * l'entrant de se croiser sans qu'un fond opaque coupe l'un des deux. Voir
 * `Front`.
 */
export const Parade: React.FC = () => {
  const frame = useCurrentFrame()
  const live = PARADE.map((shot, i) => ({ shot, i, s: shotAt(i, frame) })).filter(
    ({ s }) => s.live,
  )
  return (
    <AbsoluteFill>
      {live.map(({ shot, s }) => (
        <Back key={`b-${shot.jersey.src}`} shot={shot} s={s} />
      ))}
      {live.map(({ shot, i, s }) => (
        <Front key={`f-${shot.jersey.src}`} shot={shot} i={i} s={s} frame={frame} />
      ))}
      <Offer frame={frame} />
    </AbsoluteFill>
  )
}
