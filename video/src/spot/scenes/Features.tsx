import React from 'react'
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion'
import { C } from '../../theme'
import { EASE, lerp, pop } from '../../components/anim'
import { Backdrop, Flash } from '../Backdrop'
import { Cursor, Focus } from '../Cursor'
import { Crop, Frame, shotFile } from '../Screen'
import { Caption, Typed } from '../Type'
import { ASSETS } from '../assets'
import { G, SHOT, type Box } from '../geometry'
import { COPY } from '../timeline'
import { clampBox, spanBox, useStage, windowRect, type Stage } from '../stage'

/**
 * 3. Trois fonctions, trois gestes reels.
 *
 * C'est une vraie commande : chercher « barca », choisir la taille M, remplir
 * les trois champs. Le curseur vise les coordonnees relevees sur le site
 * (`geometry.ts`), les etats qui changent sont de vraies captures de ces
 * etats, et le formulaire — capture vide — se remplit ici, dans la
 * typographie du site. Rien n'a jamais ete envoye depuis la production.
 *
 * Chaque plan dure 60 frames : deux secondes, une mesure a 120 BPM.
 */

const UNIT = 60

/** Le cadrage d'un plan : plein cadre en 16:9, fenetre sinon. */
const useFrameFor = (
  stage: Stage,
  cx: number,
  cy: number,
  span: number,
  page: { w: number; h: number } = SHOT,
) => {
  const rect = windowRect(stage, stage.tall ? 0.46 : 0.58)
  const target = rect ?? { x: 0, y: 0, w: stage.width, h: stage.height }
  return {
    rect,
    radius: rect ? 18 : 0,
    chrome: Boolean(rect),
    page,
    focus: clampBox(spanBox(cx, cy, span, { width: target.w, height: target.h }), page),
  }
}

/**
 * L'espace de page de la capture pleine hauteur du tunnel de commande, et le
 * pont vers les boites mesurees.
 *
 * Le plan utilisait `d-form-fields`, la capture de la fenetre : tant que la
 * page defilait de 298 px, les trois champs **et** le bouton y tenaient. La
 * mise en page du tunnel a change — la capture se fait desormais a 63 px de
 * defilement et « Confirmer ma commande » tombe a 1 092, soit sous les
 * 1 080 px de la fenetre. Le bouton, son halo et le clic se dessinaient donc
 * hors de l'image.
 *
 * La capture pleine hauteur ne peut pas avoir ce probleme, quel que soit le
 * defilement : elle contient la page entiere. En echange, ses coordonnees
 * partent du haut du **document**, pas de la fenetre — d'ou `scrollY`.
 */
const FORM_ASSET = ASSETS['d-form-full']
const FORM_PAGE = { w: SHOT.w, h: (FORM_ASSET.h / FORM_ASSET.w) * SHOT.w }
const fb = (box: Box): Box => ({ ...box, y: box.y + G.form.scrollY })

/** Le texte du plan, sous la fenetre en vertical, en bas a gauche sinon. */
const CaptionSlot: React.FC<{
  i: number
  frame: number
  at: number
}> = ({ i, frame, at }) => {
  const stage = useStage()
  const f = COPY.features[i]
  const rect = windowRect(stage, stage.tall ? 0.46 : 0.58)
  return (
    <>
      {/* En 16:9 le texte est pose sur l'interface : sans ce voile, un titre
          blanc tombe parfois sur un maillot blanc. */}
      {rect ? null : (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: stage.height * 0.42,
            background: `linear-gradient(to top, ${C.bgDeep}f2 0%, ${C.bgDeep}cc 45%, transparent 100%)`,
            opacity: lerp(frame, [at - 6, at + 6], [0, 1], EASE.out),
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: stage.pad,
          right: stage.pad,
          ...(rect
            ? { top: rect.y + rect.h + rect.gap }
            : { bottom: stage.safeBottom + stage.height * 0.02 }),
          display: 'flex',
          justifyContent: rect ? 'center' : 'flex-start',
        }}
      >
      <Caption
        index={f.index}
        title={f.title}
        line={f.line}
        tag={f.tag}
        frame={frame}
        at={at}
        u={stage.u}
          align={rect ? 'center' : 'left'}
        />
      </div>
    </>
  )
}

/* ------------------------------------------------------ 01 · la recherche */

/**
 * « barca » trouve Barcelone : c'est l'alias, pas le nom, et c'est ce que
 * fait vraiment la recherche du site. Le champ est capture vide et focalise,
 * les lettres sont posees dedans, puis la vraie liste de resultats arrive a
 * sa vraie coordonnee.
 */
export const Search: React.FC = () => {
  const frame = useCurrentFrame()
  const stage = useStage()
  const field = G.search.field as Box
  const list = G.search.listbox as Box
  const result = G.search.firstResult as Box

  // La camera plonge du plan large vers le champ, puis se pose.
  const t = lerp(frame, [0, 26], [0, 1], EASE.out)
  const cx = lerp(t, [0, 1], [960, field.x + field.w / 2])
  const cy = lerp(t, [0, 1], [460, 168])
  const span = lerp(t, [0, 1], [1920, 1180]) * lerp(frame, [26, UNIT], [1, 0.94], EASE.inOut)
  const view = useFrameFor(stage, cx, cy, span)

  const CLICK_FIELD = 10
  const TYPE_FROM = 14
  /** « barca » : cinq lettres, deux frames chacune. */
  const TYPED_AT = TYPE_FROM + 5 * 2
  const LIST_AT = 28
  const CLICK_RESULT = 44

  const listIn = pop(frame, { delay: LIST_AT, damping: 16, stiffness: 180 })

  return (
    <AbsoluteFill>
      <Backdrop frame={frame} energy={0.7} />
      <Frame {...view}>
        <Img src={shotFile('d-search-open')} style={{ width: SHOT.w, height: SHOT.h }} />

        {/* Le champ est capture vide : la frappe se pose dedans, dans la
            police du site. Une fois le mot complet, le vrai champ de
            `d-search-barca` prend le relais — a partir de la, chaque pixel
            du plan vient du site. */}
        {frame < TYPED_AT ? (
          <Typed
            box={field}
            text="barca"
            frame={frame}
            from={TYPE_FROM}
            per={2}
            fontSize={16}
            padLeft={61}
          />
        ) : (
          <Crop src="d-search-barca" box={field} />
        )}

        {/* La vraie liste de resultats, a sa vraie place. */}
        <div
          style={{
            position: 'absolute',
            left: list.x,
            top: list.y,
            width: list.w,
            height: list.h,
            opacity: lerp(frame, [LIST_AT, LIST_AT + 4], [0, 1], EASE.out),
            transform: `translateY(${(1 - listIn) * -10}px) scaleY(${0.86 + listIn * 0.14})`,
            transformOrigin: 'top center',
          }}
        >
          <Img src={shotFile('d-search-listbox')} style={{ width: '100%', height: '100%' }} />
        </div>

        <Focus box={result} frame={frame} at={CLICK_RESULT - 8} radius={10} />

        <Cursor
          frame={frame}
          from={2}
          path={[
            { at: 2, to: { x: field.x + field.w * 0.78, y: 420 } },
            { at: CLICK_FIELD, to: { x: field.x + 180, y: field.y + 26 }, arc: 40 },
            { at: 40, to: { x: field.x + 320, y: field.y + 30 } },
            { at: CLICK_RESULT, to: result, arc: 24 },
            { at: UNIT, to: result },
          ]}
          clicks={[CLICK_FIELD, CLICK_RESULT]}
        />
      </Frame>
      <CaptionSlot i={0} frame={frame} at={16} />
      <Flash frame={frame} at={CLICK_RESULT + 2} peak={0.28} len={5} />
    </AbsoluteFill>
  )
}

/* --------------------------------------------------------- 02 · la taille */

/**
 * La taille, et le vrai stock : sur cette fiche, S est epuise — son bouton
 * est en pointilles et desactive. C'est la capture qui le dit, pas une
 * annotation.
 */
export const Size: React.FC = () => {
  const frame = useCurrentFrame()
  const stage = useStage()
  const sizeGroup = G.product.sizeGroup as Box
  const sizeM = G.product.sizeM as Box
  const add = G.product.addToCart as Box
  const icons = G.product.cartIcon as Box

  // Le plan s'ouvre sur la fiche entiere — le maillot doit etre vu — puis
  // plonge sur la colonne de droite, la ou se passe le geste.
  const t = lerp(frame, [0, 26], [0, 1], EASE.out)
  const cx = lerp(t, [0, 1], [960, 1150])
  const cy = lerp(t, [0, 1], [420, 400])
  const span = lerp(t, [0, 1], [1320, 920]) * lerp(frame, [26, UNIT], [1, 0.96], EASE.inOut)
  const view = useFrameFor(stage, cx, cy, span)

  const CLICK_SIZE = 14
  const CLICK_ADD = 36
  const picked = frame >= CLICK_SIZE

  return (
    <AbsoluteFill>
      <Backdrop frame={frame} energy={0.7} />
      <Frame {...view}>
        <Img src={shotFile('d-product')} style={{ width: SHOT.w, height: SHOT.h }} />

        {/* L'etat « taille choisie » est une capture de cet etat, pas un
            cadre dessine par-dessus. */}
        {picked ? (
          <Img
            src={shotFile('d-sizes-picked')}
            style={{
              position: 'absolute',
              left: sizeGroup.x,
              top: sizeGroup.y,
              width: sizeGroup.w,
              height: sizeGroup.h,
              opacity: lerp(frame, [CLICK_SIZE, CLICK_SIZE + 2], [0, 1]),
            }}
          />
        ) : null}

        {/* La pastille du panier passe a 1 : la vraie, capturee apres le
            clic sur « Ajouter au panier ». */}
        {frame >= CLICK_ADD ? (
          <Img
            src={shotFile('p-icons-1')}
            style={{
              position: 'absolute',
              left: icons.x,
              top: icons.y,
              width: icons.w,
              height: icons.h,
              transform: `scale(${1 + pop(frame, { delay: CLICK_ADD, damping: 9, stiffness: 220 }) * 0.001})`,
            }}
          />
        ) : null}

        <Focus box={sizeM} frame={frame} at={CLICK_SIZE - 7} radius={8} />
        <Focus box={add} frame={frame} at={CLICK_ADD - 8} radius={8} />

        <Cursor
          frame={frame}
          from={1}
          path={[
            { at: 1, to: { x: 1500, y: 700 } },
            { at: CLICK_SIZE, to: sizeM, arc: 50 },
            { at: CLICK_ADD, to: add, arc: 30 },
            { at: UNIT, to: { x: add.x + add.w * 0.6, y: add.y + add.h * 0.5 } },
          ]}
          clicks={[CLICK_SIZE, CLICK_ADD]}
        />
      </Frame>
      <CaptionSlot i={1} frame={frame} at={14} />
      <Flash frame={frame} at={CLICK_ADD + 1} peak={0.22} len={5} />
    </AbsoluteFill>
  )
}

/* ------------------------------------------------------ 03 · la commande */

/**
 * Trois champs, pas de compte. Le formulaire vient de la capture `d-form-
 * fields`, prise dans le defilement ou les trois champs et le bouton tiennent
 * dans un seul cadre — c'est pour ca que la geometrie porte son `scrollY`.
 *
 * Les valeurs tapees sont inventees pour le film. Le bouton est presse sur la
 * derniere frame du plan : la coupe tombe sur le clic, et le chiffre arrive.
 */
export const Order: React.FC = () => {
  const frame = useCurrentFrame()
  const stage = useStage()
  const name = fb(G.form.name as Box)
  const phone = fb(G.form.phone as Box)
  const address = fb(G.form.address as Box)
  const confirm = fb(G.form.confirm as Box)

  const t = lerp(frame, [0, 22], [0, 1], EASE.out)
  const cx = 960
  const cy = lerp(t, [0, 1], [700, 960])
  const span = lerp(t, [0, 1], [1800, 1380]) * lerp(frame, [22, UNIT], [1, 0.97], EASE.inOut)
  const view = useFrameFor(stage, cx, cy, span, FORM_PAGE)

  const CLICK_NAME = 8
  const CLICK_PHONE = 22
  const CLICK_ADDR = 34
  const CLICK_SEND = 54

  return (
    <AbsoluteFill>
      <Backdrop frame={frame} energy={0.7} />
      <Frame {...view}>
        <Img src={shotFile('d-form-full')} style={{ width: FORM_PAGE.w, height: FORM_PAGE.h }} />

        {/* Des valeurs inventees pour le film : le formulaire a ete capture
            vide, et rien n'a jamais ete envoye depuis la production. */}
        <Typed box={name} text="Fatou Ndiaye" frame={frame} from={CLICK_NAME + 2} per={1} />
        <Typed box={phone} text="77 123 45 67" frame={frame} from={CLICK_PHONE + 2} per={1} />
        <Typed
          box={address}
          text="Sacré-Cœur 3, villa 118"
          frame={frame}
          from={CLICK_ADDR + 2}
          per={0.8}
          padTop={14}
        />

        <Focus box={confirm} frame={frame} at={CLICK_SEND - 8} radius={8} />

        {/* Le bouton s'enfonce : un bouton clique qui ne bouge pas ne dit
            pas qu'il a ete clique. */}
        <div
          style={{
            position: 'absolute',
            left: confirm.x,
            top: confirm.y,
            width: confirm.w,
            height: confirm.h,
            borderRadius: 8,
            background: C.fg,
            opacity: lerp(frame, [CLICK_SEND, CLICK_SEND + 2, CLICK_SEND + 9], [0, 0.22, 0]),
          }}
        />

        <Cursor
          frame={frame}
          from={0}
          path={[
            { at: 0, to: { x: 1380, y: name.y - 110 } },
            { at: CLICK_NAME, to: { x: name.x + 190, y: name.y + 24 }, arc: 40 },
            { at: CLICK_PHONE, to: { x: phone.x + 150, y: phone.y + 24 }, arc: 16 },
            { at: CLICK_ADDR, to: { x: address.x + 210, y: address.y + 22 }, arc: 16 },
            { at: CLICK_SEND, to: confirm, arc: 30 },
            { at: UNIT, to: confirm },
          ]}
          clicks={[CLICK_NAME, CLICK_PHONE, CLICK_ADDR, CLICK_SEND]}
        />
      </Frame>
      <CaptionSlot i={2} frame={frame} at={10} />
      <Flash frame={frame} at={CLICK_SEND + 2} peak={0.3} len={6} />
    </AbsoluteFill>
  )
}
