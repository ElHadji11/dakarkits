import React from 'react'
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion'
import { EASE, lerp, pop } from '../../components/anim'
import { C } from '../../theme'
import { Flash } from '../../spot/Backdrop'
import { Cursor, Focus } from '../../spot/Cursor'
import { Crop, Shot, shotFile } from '../../spot/Screen'
import { Typed } from '../../spot/Type'
import { GM, SHOT_M, type Box } from '../../spot/geometry'
import { Caption, UiBackdrop, WIN_PHONE, WindowShadow, track } from '../Stage'
import { COPY } from '../timeline'

/**
 * La commande, jouee pour de vrai — et jouee sur un telephone.
 *
 * Regle du film : **l'interface n'est jamais redessinee**. Chaque plan est
 * une capture de louyomb.com, le doigt vise les coordonnees relevees sur le
 * site (`GM` dans `geometry.ts`), et les etats qui changent — « barca » dans
 * le champ, la taille M active, la pastille du panier a 1 — sont de vraies
 * captures de ces etats-la.
 *
 * Ce qui est anime ici, et seulement ca : la camera, le doigt, et les lettres
 * tapees dans des champs captures **vides**. Rien n'a jamais ete envoye
 * depuis la production : la recherche et le choix de taille sont cote client,
 * et le bouton « Confirmer ma commande » est presse dans Remotion, jamais
 * dans un navigateur.
 *
 * ---
 *
 * **Pourquoi le telephone.** Ces trois plans etaient montes sur les captures
 * de bureau. Une page de 1 920 px de large ramenee dans une fenetre de 984
 * sort a 0,83x : les libelles du formulaire tombaient a douze pixels de haut
 * a l'ecran, et le plan qui porte toute la promesse — « trois champs, pas de
 * compte » — etait le seul qu'on ne pouvait pas lire. Zoomer ne corrigeait
 * rien, ca ne faisait que sortir du cadre les champs qu'on voulait montrer.
 *
 * La capture de telephone fait 430 px de large : dans la meme fenetre elle
 * est a 2,09x, soit deux fois et demie plus grand qu'avant. Et c'est la mise
 * en page que le client voit vraiment, puisque la boutique se regarde au
 * telephone.
 *
 * **Le gain de montage est ailleurs, et il est plus grand.** Les captures de
 * telephone sont des vues de fenetre, prises apres defilement, et `GM` est
 * mesure dans ce meme defilement : les coordonnees tombent au pixel sur les
 * images, sans le pont `scrollY` que la version de bureau devait faire a la
 * main. Un champ qui bouge au prochain `npm run capture` bouge dans les deux
 * en meme temps.
 */

/**
 * Le fond reel des champs de saisie, **releve au pixel** sur les captures.
 *
 * `GM.colors.input` vaut `#000000` : la mesure lit la couleur calculee du
 * champ, qui est transparente, et `rgba(0,0,0,0)` se serialise en noir. Poser
 * ce noir derriere la frappe dessinerait une bande noire dans un champ qui ne
 * l'est pas. Les deux valeurs ci-dessous sont lues dans les PNG eux-memes, et
 * ce sont **les memes qu'en bureau** : le theme ne change pas avec la
 * largeur, seule la mise en page change.
 */
const FIELD = { search: '#17172b', form: '#18182b' } as const

/** Les captures de telephone vivent dans un espace de page de 430 px. */
const BASE = SHOT_M.w

/* ------------------------------------------------------ 01 · la recherche */

/**
 * « barca » trouve le FC Barcelone : c'est l'alias, pas le nom, et c'est ce
 * que fait vraiment la recherche du site.
 *
 * Le plan ouvre sur l'ecran d'accueil entier — la banniere, les maillots —
 * puis serre sur le champ et son resultat. Le rapproche est doux : a 2,09x de
 * depart le texte est deja lisible, et une plongee violente sur une interface
 * deja grande se lit comme un effet, pas comme un regard.
 */
export const Search: React.FC = () => {
  const frame = useCurrentFrame()
  const field = GM.search.field as Box
  const list = GM.search.listbox as Box
  const result = GM.search.firstResult as Box

  const TAP_FIELD = 8
  const TYPE_FROM = 12
  /** « barca » : cinq lettres, deux frames chacune. */
  const TYPED_AT = TYPE_FROM + 5 * 2
  const LIST_AT = 26
  const TAP_RESULT = 46

  /*
   * On serre pour taper, on s'ouvre pour lire le resultat.
   *
   * Le plan ouvre sur l'ecran entier — la banniere, les maillots, la barre de
   * recherche a sa place. Puis il serre a 300 px sur le champ, le temps que
   * « barca » s'ecrive : a 3,0x, cinq lettres de 16 px font 48 px de haut et
   * la frappe devient le sujet du plan.
   *
   * **Et il rouvre avant que la liste tombe.** Le resultat porte son prix
   * cale a droite, a x = 413 : le garder dans un cadre de 300 px le
   * couperait, et c'est exactement l'accident que la regle de largeur fixe
   * existait pour empecher (voir `framePhone`). Le serrage ne vit donc que
   * pendant la frappe, ou tout ce qui compte est a gauche.
   *
   * Le centre vertical ne descend jamais sous 240 a pleine largeur : la
   * moitie de la hauteur visible. Plus bas, le cadre sortirait par le haut de
   * l'ecran et montrerait du vide au-dessus de la banniere.
   */
  const focus = track(frame, [
    { at: 0, cy: 268 },
    { at: 6, cy: 268 },
    // Le champ en gros plan. Le bord gauche du cadre tombe a x = 10 : six
    // pixels avant la boite du champ (16), donc une marge visible et non
    // un bord rase — a 3,0x, quatre pixels de trop mangent la moitie d'une
    // lettre, et un libelle ampute se lit comme une capture ratee.
    { at: 15, cx: 160, cy: 176, w: 300 },
    { at: TYPED_AT, cx: 160, cy: 176, w: 300 },
    // Reouverture, calee pour que la liste soit entiere quand elle tombe.
    { at: LIST_AT + 4, cy: 240 },
    { at: 60, cy: 234 },
  ])

  const listIn = pop(frame, { delay: LIST_AT, damping: 16, stiffness: 180 })

  return (
    <AbsoluteFill>
      <UiBackdrop frame={frame} />
      <WindowShadow frame={frame} win={WIN_PHONE} />
      <Shot src="m-search-open" rect={WIN_PHONE} radius={30} focus={focus} base={BASE}>
        {/* Le champ est capture vide : la frappe se pose dedans, dans la
            police du site. Des que le mot est complet, le vrai champ de
            `m-search-barca` prend le relais — a partir de la, chaque pixel du
            plan vient du site. */}
        {frame < TYPED_AT ? (
          <Typed
            box={field}
            text="barca"
            frame={frame}
            from={TYPE_FROM}
            per={2}
            fontSize={16}
            padLeft={39}
            fieldBg={FIELD.search}
          />
        ) : (
          <Crop src="m-search-barca" box={field} base={BASE} />
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
            transform: `translateY(${(1 - listIn) * -8}px) scaleY(${0.86 + listIn * 0.14})`,
            transformOrigin: 'top center',
          }}
        >
          <Img src={shotFile('m-search-listbox')} style={{ width: '100%', height: '100%' }} />
        </div>

        <Focus box={result} frame={frame} at={TAP_RESULT - 9} radius={10} />

        <Cursor
          touch
          frame={frame}
          from={1}
          path={[
            { at: 1, to: { x: field.x + field.w * 0.72, y: 300 } },
            { at: TAP_FIELD, to: { x: field.x + 120, y: field.y + 22 }, arc: 30 },
            { at: 40, to: { x: field.x + 190, y: field.y + 24 } },
            { at: TAP_RESULT, to: result, arc: 16 },
            { at: 60, to: result },
          ]}
          clicks={[TAP_FIELD, TAP_RESULT]}
        />
      </Shot>

      <Caption
        index={COPY.search.index}
        title={COPY.search.title}
        line={COPY.search.line}
        frame={frame}
        at={10}
      />
      <Flash frame={frame} at={TAP_RESULT + 2} peak={0.26} len={5} />
    </AbsoluteFill>
  )
}

/* ---------------------------------------------------------- 02 · la taille */

/**
 * La taille, et le panier.
 *
 * **La photo du maillot n'est pas dans ce plan**, et c'est la seule chose que
 * la version de bureau faisait mieux. Sur telephone, choisir une taille
 * demande de defiler : quand le selecteur est a l'ecran, la photo est
 * au-dessus, sortie par le haut. Aucun cadrage ne peut contenir les deux —
 * ils sont a 700 px l'un de l'autre pour 480 px visibles.
 *
 * Le film l'accepte parce qu'il a deja montre des maillots pendant cinq
 * secondes pleines, et parce que ce que ce cadrage-ci porte a la place vaut
 * l'echange : le prix barre, les deux lignes qui comptent (« Tu paies a la
 * livraison », « Livraison gratuite partout a Dakar »), les cinq tailles, le
 * delai, et le bareme entier — « 2 maillots au choix pour 13 000 F, 3 pour
 * 19 500 F ». La version de bureau n'en tenait pas la moitie.
 *
 * L'etat de depart pose une difficulte : la capture de reference
 * (`m-product-picked`) a **deja** la taille M choisie, puisqu'il a fallu
 * cliquer pour l'obtenir. Le selecteur vierge est donc repose par-dessus
 * jusqu'au tap — c'est `m-sizes`, capture du meme groupe avant le clic. Les
 * deux images viennent du site ; aucune n'est redessinee.
 */
export const Pick: React.FC = () => {
  const frame = useCurrentFrame()
  const sizeGroup = GM.product.sizeGroup as Box
  const sizeM = GM.product.sizeM as Box
  const add = GM.product.addToCart as Box

  const TAP_SIZE = 16
  const TAP_ADD = 42
  const picked = frame >= TAP_SIZE

  /*
   * Le plan descend : la fiche, puis les tailles, puis le panier.
   *
   * **Le montage precedent tenait un cadrage fixe sur 144 → 632, et le
   * bouton du panier est a 868.** Le doigt partait donc le chercher sous le
   * bord de la fenetre et le tap se jouait hors champ : on voyait la pastille
   * passer a 1 sans avoir vu ce qui l'y avait mise. Le `Focus` pose sur le
   * bouton n'etait pas visible non plus. Deux secondes de plan pour un geste
   * qu'on ne voit pas.
   *
   * La camera descend donc avec le doigt, et le bouton colle en bas d'ecran
   * entre dans le cadre une douzaine de frames avant d'etre presse.
   *
   * **Le selecteur de taille, lui, ne se serre pas du tout.** Les cinq
   * tailles vont de x = 16 a x = 414 sur une page de 430 : le groupe occupe
   * la largeur entiere a seize pixels pres, et serrer coupe le bord de S ou
   * celui de XXL. Il n'y avait que 8 % a gagner et une marge nulle a y
   * perdre — contre 43 % sur le formulaire, ou tout est cale a gauche et ou
   * la moitie droite des champs est vide.
   *
   * Ce plan-ci ne se lit donc pas par le zoom, il se lit par le libelle :
   * c'est pour ca que le sien dit ce que les petites lignes disent.
   */
  const focus = track(frame, [
    { at: 0, cy: 384 },
    { at: 8, cy: 384 },
    // Les tailles au centre du cadre — et a pleine largeur, voir plus haut.
    { at: TAP_SIZE, cy: 466 },
    { at: 28, cy: 470 },
    // Et on descend sur la barre collee en bas, bouton du panier compris.
    { at: TAP_ADD - 10, cy: 690 },
    { at: 60, cy: 694 },
  ])

  return (
    <AbsoluteFill>
      <UiBackdrop frame={frame} />
      <WindowShadow frame={frame} win={WIN_PHONE} />
      {/* Apres l'ajout, la capture devient celle d'apres l'ajout : les deux
          images sont identiques au pixel pres sauf la pastille du panier,
          donc la bascule ne se voit pas — seule la pastille apparait. */}
      <Shot
        src={frame >= TAP_ADD ? 'm-added' : 'm-product-picked'}
        rect={WIN_PHONE}
        radius={30}
        focus={focus}
        base={BASE}
      >
        {!picked ? (
          <Img
            src={shotFile('m-sizes')}
            style={{
              position: 'absolute',
              left: sizeGroup.x,
              top: sizeGroup.y,
              width: sizeGroup.w,
              height: sizeGroup.h,
            }}
          />
        ) : null}

        <Focus box={sizeM} frame={frame} at={TAP_SIZE - 8} radius={8} />
        <Focus box={add} frame={frame} at={TAP_ADD - 9} radius={10} />

        <Cursor
          touch
          frame={frame}
          from={1}
          path={[
            { at: 1, to: { x: 330, y: 700 } },
            { at: TAP_SIZE, to: sizeM, arc: 34 },
            { at: TAP_ADD, to: add, arc: 26 },
            { at: 60, to: add },
          ]}
          clicks={[TAP_SIZE, TAP_ADD]}
        />
      </Shot>

      <Caption
        index={COPY.pick.index}
        title={COPY.pick.title}
        line={COPY.pick.line}
        frame={frame}
        at={8}
      />
      <Flash frame={frame} at={TAP_ADD + 1} peak={0.2} len={5} />
    </AbsoluteFill>
  )
}

/* -------------------------------------------------------- 03 · la commande */

/**
 * Trois champs, et c'est fini.
 *
 * Le plan se joue sur `m-form-bottom` : le tunnel de commande **descendu en
 * bas de page**. Ce n'est pas un detail de capture, c'est ce qui rend le plan
 * possible. Le bouton « Confirmer ma commande » est colle en bas de l'ecran ;
 * en haut de page il recouvre le champ « Adresse de livraison » et n'en
 * laisse voir qu'une trentaine de pixels. Un plan qui annonce « trois
 * champs » ne peut pas en montrer deux et demi.
 *
 * Descendu en bas, le document ne bouge plus mais le bouton reste a sa place :
 * les trois champs se degagent entierement et le recapitulatif reste visible
 * par le haut, total compris. Un seul ecran porte alors **tout** ce que le
 * film a a dire ici — 7 500 F a payer a la livraison, trois champs, le bouton
 * — et c'est pourquoi ce plan montre enfin le montant, ce que la version de
 * bureau devait soigneusement eviter : sa capture totalisait deux maillots
 * quand le film n'en avait mis qu'un au panier.
 *
 * La camera descend avec le formulaire qui se remplit. Elle part sur le
 * total et les deux premiers champs, et finit sur l'adresse et le bouton :
 * c'est le trajet de l'oeil de quelqu'un qui remplit, et il amene le bouton
 * dans le cadre juste avant qu'on le presse.
 *
 * Les valeurs tapees sont inventees pour le film. Les champs ont ete captures
 * vides, avec leurs textes d'invite — `Typed` les efface avant d'ecrire,
 * sinon la frappe se superpose a « Ex : Awa Diop » et plus rien ne se lit.
 */
export const Fill: React.FC = () => {
  const frame = useCurrentFrame()
  const name = GM.formBottom.name as Box
  const phone = GM.formBottom.phone as Box
  const address = GM.formBottom.address as Box
  const confirm = GM.formBottom.confirm as Box

  const TAP_NAME = 10
  const TAP_PHONE = 34
  const TAP_ADDR = 56
  const TAP_SEND = 100

  /*
   * **Le plan qui gagne le plus au serrage, et de loin.**
   *
   * Il ouvre large : le total a payer, « Ou te livrer », les trois champs
   * vides. C'est la seule image qui dise « trois champs » en les montrant —
   * elle vaut une demi-seconde, et elle est la raison pour laquelle le plan
   * ne commence pas serre.
   *
   * Puis la camera tombe a 300 px de large et suit le champ qui se remplit,
   * un par un. Les libelles sont a x = 16 et la saisie a x = 28 : un cadre qui
   * part du bord gauche les porte en entier, et a 3,0x « Fatou Ndiaye »
   * s'ecrit en 48 px au lieu de 33. Les champs sortent du cadre par la
   * droite, et c'est voulu — leur moitie droite est vide, c'est la frappe le
   * sujet.
   *
   * Elle rouvre pour la fin : le bouton « Confirmer ma commande » est colle
   * en bas d'ecran a 868, et il n'entre dans aucun cadre serre sur l'adresse.
   * Le dernier geste du plan se voit donc en entier, a pleine largeur.
   */
  const focus = track(frame, [
    // L'etablissement : total, legende, les trois champs vides.
    { at: 0, cy: 422 },
    { at: 5, cy: 422 },
    // Le nom.
    { at: TAP_NAME + 4, cx: 160, cy: 404, w: 300 },
    { at: 26, cx: 160, cy: 404, w: 300 },
    // Le telephone.
    { at: TAP_PHONE + 2, cx: 160, cy: 490, w: 300 },
    { at: 50, cx: 160, cy: 490, w: 300 },
    // L'adresse — deux lignes, donc un centre plus bas.
    { at: TAP_ADDR + 4, cx: 160, cy: 609, w: 300 },
    { at: 82, cx: 160, cy: 609, w: 300 },
    // Reouverture sur le bouton, calee pour etre finie avant le tap.
    { at: TAP_SEND - 6, cy: 690 },
    { at: 120, cy: 694 },
  ])

  return (
    <AbsoluteFill>
      <UiBackdrop frame={frame} />
      <WindowShadow frame={frame} win={WIN_PHONE} />
      <Shot src="m-form-bottom" rect={WIN_PHONE} radius={30} focus={focus} base={BASE}>
        <Typed
          box={name}
          text="Fatou Ndiaye"
          frame={frame}
          from={TAP_NAME + 3}
          per={1.1}
          padLeft={12}
          fieldBg={FIELD.form}
        />
        <Typed
          box={phone}
          text="77 123 45 67"
          frame={frame}
          from={TAP_PHONE + 3}
          per={1.1}
          padLeft={12}
          fieldBg={FIELD.form}
        />
        <Typed
          box={address}
          text="Sacré-Cœur 3, villa 118"
          frame={frame}
          from={TAP_ADDR + 3}
          per={0.9}
          padLeft={12}
          padTop={14}
          fieldBg={FIELD.form}
        />

        <Focus box={confirm} frame={frame} at={TAP_SEND - 10} radius={10} />

        {/* Le bouton s'enfonce : un bouton presse qui ne bouge pas ne dit pas
            qu'il a ete presse. */}
        <div
          style={{
            position: 'absolute',
            left: confirm.x,
            top: confirm.y,
            width: confirm.w,
            height: confirm.h,
            borderRadius: 10,
            background: C.bgDeep,
            opacity: lerp(frame, [TAP_SEND, TAP_SEND + 2, TAP_SEND + 10], [0, 0.3, 0]),
          }}
        />

        <Cursor
          touch
          frame={frame}
          from={0}
          path={[
            { at: 0, to: { x: 340, y: name.y - 70 } },
            { at: TAP_NAME, to: { x: name.x + 150, y: name.y + 24 }, arc: 28 },
            { at: TAP_PHONE, to: { x: phone.x + 130, y: phone.y + 24 }, arc: 14 },
            { at: TAP_ADDR, to: { x: address.x + 170, y: address.y + 22 }, arc: 14 },
            { at: TAP_SEND, to: confirm, arc: 24 },
            { at: 120, to: confirm },
          ]}
          clicks={[TAP_NAME, TAP_PHONE, TAP_ADDR, TAP_SEND]}
        />
      </Shot>

      <Caption
        index={COPY.fill.index}
        title={COPY.fill.title}
        line={COPY.fill.line}
        frame={frame}
        at={8}
        until={TAP_SEND - 6}
      />
      <Flash frame={frame} at={TAP_SEND + 2} peak={0.34} len={7} />
    </AbsoluteFill>
  )
}
