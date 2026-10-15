# Plan « fluidité Telegram » pour DakarKits

Audit fait le 2026-10-15 sur `louyomb.com` (Chrome, 375 × 812) et sur le code de
ce dépôt. L'objectif : la sensation de Telegram — continuité, retour au doigt,
rien qui saute — **sans rien reprendre de ce que les corrections de LCP du
2026-10-07 ont gagné**.

---

## 1. Ce que Telegram fait vraiment

Telegram ne « met pas des animations ». Il applique quatre règles, et c'est
cela qu'on copie :

1. **Un objet qui persiste ne disparaît jamais.** Une photo de la liste devient
   la photo plein écran : le même objet bouge, il n'y a pas deux objets qui se
   remplacent. C'est le seul effet dont l'absence se *sent* même sans savoir le
   nommer.
2. **Tout appui répond en moins de 100 ms**, avant même que l'action ait lieu.
   Un bouton s'enfonce, une vibration de 10 ms part. L'interface ne réfléchit
   jamais en silence.
3. **Le geste est réversible.** On tire un panneau vers le bas, le fond
   s'éclaircit progressivement, on relâche avant la moitié : rien ne s'est
   passé. L'utilisateur garde la main pendant toute l'animation.
4. **Aucune action destructrice n'est définitive sans un « Annuler »** qui monte
   du bas pendant quelques secondes.

Le reste — réactions animées, effet de poussière à la suppression, chiffres qui
roulent — est du décor par-dessus ces quatre règles. Du décor posé sur une base
qui ne les respecte pas donne une interface clinquante et poussive, exactement
ce qu'il faut éviter sur un Android d'entrée de gamme en 4G.

---

## 2. Ce que DakarKits a déjà (à ne pas reconstruire)

L'audit du code a trouvé plus de choses en place que la liste de départ ne le
supposait. Les propositions qui doublonnent avec ça sont écartées plus bas.

| Déjà là | Où |
| --- | --- |
| Appui qui répond sur le cœur (`active:scale-90`, 150 ms) | `components/shop/favorite-button.tsx` |
| Appui qui répond sur tous les boutons (`active:translate-y-px`) | `components/ui/button.tsx` |
| Appui qui répond sur la carte produit (`active:bg-card/70`) | `components/shop/product-card.tsx` |
| **Balayage horizontal entre les photos**, en CSS scroll-snap, avec les pastilles de position | `components/shop/product-gallery.tsx` |
| Panneaux tirables avec vaul, chargés au premier appui seulement | `filter-drawer.tsx`, `size-guide.tsx` |
| Toasts (sonner) | `product-purchase.tsx` (ajout au panier) |
| En-tête qui s'efface au défilement, sans état React | `hooks/use-hide-on-scroll.ts` |
| Apparition du pied de page pilotée par le défilement, 0 octet de JS | `app/globals.css`, `animation-timeline: view()` |
| `prefers-reduced-motion` traité, avec le piège Radix déjà réglé | `app/globals.css` |
| Grille réelle dans le HTML dès le premier octet (donc pas besoin de squelette scintillant sur le catalogue) | `components/shop/static-grid.tsx` |
| Chiffres tabulaires partout où il y a un montant | `tabular-nums` |

**Donc : pas d'Embla.** La galerie balaie déjà, en CSS. Installer une
bibliothèque de carrousel de 20 Ko pour retrouver ce que `snap-x
snap-mandatory` fait gratuitement serait une régression.

---

## 3. Ce qui manque, par ordre de ce que ça rapporte

### 3.1 Aucune transition d'élément partagé — le manque n° 1

`grep -rn "ViewTransition"` ne renvoie **rien** dans tout le dépôt. Taper une
carte fait disparaître la grille et apparaître la fiche : deux écrans sans lien
visuel, alors que c'est la même photo du même maillot.

C'est le seul point de cette liste qui change la sensation générale plutôt
qu'un détail, **et il est gratuit** : React 19.3.0 et Next 16.4.0 sont déjà
installés, `<ViewTransition>` vient de `react` lui-même, et le guide
(`node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`) précise que
ça marche dans l'App Router **sans configuration**. Zéro octet de dépendance.

**Piège à traiter dès la conception**, sinon l'effet ne jouera pas : le morph ne
se produit que si la page de destination rend son contenu *dans le même commit*
que la navigation. Or `app/(shop)/maillot/[slug]/page.tsx` attend `params`
derrière un `<Suspense fallback={<ProductSkeleton />}>` — c'est le correctif
voulu pour la 4G, on n'y touche pas. Il faut donc :

- vérifier que le lien de la carte est bien préchargé (aucun `prefetch` n'est
  posé nulle part aujourd'hui ; les fiches sont prérendues par
  `generateStaticParams`, donc le payload devrait être en cache — à mesurer, pas
  à supposer) ;
- et **porter le même `name` sur le bloc image de `ProductSkeleton`**, pour que
  la paire se forme avec le squelette quand le fallback passe quand même. C'est
  ce détail qui fait la différence entre « ça marche sur mon portable » et « ça
  marche en 4G à Dakar ».

Fichiers concernés : `product-card.tsx` (le `name`), `product-gallery.tsx` (la
première photo), la page produit (`ProductSkeleton`), et `site-header.tsx` qui
doit être **ancré** (`::view-transition-group(site-header) { animation: none }`)
pour ne pas glisser avec le contenu.

### 3.2 Pas de visionneuse plein écran — **mise de côté**

> Écartée par décision du 2026-10-15, à ne pas reprendre sans nouvelle
> consigne. Le reste du § est conservé pour le jour où la question revient.

Taper la photo sur la fiche produit ne fait rien. Telegram, lui, ouvre la photo
en plein écran et la laisse se refermer en la tirant vers le bas, le fond
s'éclaircissant au fur et à mesure.

Sur une boutique de répliques, ce n'est pas du confort : **c'est l'argument de
vente**. La règle « les photos sont les nôtres » (AGENTS.md) existe précisément
pour que le client voie le vrai maillot ; l'empêcher de zoomer dessus annule une
partie du bénéfice. Et c'est le motif de refus n° 2 à la livraison.

vaul est déjà installé et sait faire le tirer-pour-fermer avec le fond qui
s'éclaircit. Nouveau composant, chargé dynamiquement au premier appui, comme
le guide des tailles.

### 3.3 Retour au doigt incomplet, et zéro vibration

- Les pastilles de taille n'ont que `transition-colors` : aucun enfoncement.
  C'est pourtant l'appui le plus important de la fiche, celui qui précède
  « Commander ».
- La barre d'achat collée n'a que le `translate-y-px` générique du bouton. Sur
  l'action qui vend, c'est maigre.
- `navigator.vibrate` n'apparaît **nulle part**. iOS Safari ne l'implémente pas
  du tout, mais le parc visé est très majoritairement Android : c'est donc une
  amélioration progressive qui touchera la plupart des visiteurs. 10 ms, pas
  plus, et seulement sur les appuis qui engagent (taille choisie, ajout au
  panier, commande envoyée) — pas sur chaque tap, sinon le téléphone bourdonne.

### 3.4 Aucune action destructrice n'a d'« Annuler » — ✅ fait (phase 1)

Retirer un favori et supprimer une ligne du panier sont **silencieux et
définitifs** (`favorite-button.tsx`, `cart-lines.tsx`). C'est la règle n° 4 de
Telegram, et c'est le poste le moins cher de toute cette liste : sonner est déjà
là et gère les toasts à action. Les stores zustand (`stores/favorites`,
`stores/cart`) savent déjà remettre la ligne — l'annulation est un `add()`.

### 3.5 Images sans montée progressive

`placeholder="blur"` n'est utilisé nulle part, et **ce n'est pas un oubli
anodin** : le loader ImageKit est personnalisé (`lib/image-loader.ts`), donc
Next ne peut pas fabriquer de `blurDataURL` tout seul pour une image distante.
Il faut le fournir, et ImageKit sait le produire (`tr=w-20,bl-10`) — soit une
vignette floue de quelques centaines d'octets, à poser au niveau de
`getCatalog()` pour qu'elle voyage avec le produit.

Sur le catalogue l'effet sera discret (les cartes sont déjà dans le HTML), mais
sur la fiche produit et la visionneuse plein écran c'est exactement le « flou
puis net » de Telegram.

### 3.6 Les montants sautent

Le total du panier, la remise pack et la relance `nextPackStep()` passent d'une
valeur à l'autre d'un coup. Les chiffres tabulaires sont déjà en place, donc le
terrain est prêt. À faire **en CSS**, pas avec une bibliothèque de compteur.

Attention à la règle du projet : **aucun prix en `font-display`**, et pas de
montant sorti dans son propre `<span>` à l'intérieur d'un flex à `gap` (le piège
du 2026-10-07 — 8 px de gouttière parasites).

### 3.7 La confirmation de commande ne célèbre rien

`app/(checkout)/commande/confirmee/[token]/page.tsx` affiche un `CheckCircle2`
statique. C'est le seul moment de tout le parcours où l'on peut se permettre une
dépense : la vente est faite, le LCP de cette page n'a aucune importance
commerciale, et c'est la page qu'on montre à un ami.

`canvas-confetti` convient (≈ 8 Ko gz), **à condition** d'être importé
dynamiquement, après le rendu, et d'être coupé sous
`prefers-reduced-motion: reduce`.

### 3.8 Ce que la liste de départ ne mentionnait pas

Quatre trouvailles de l'audit, dont **deux vrais bugs** qui n'ont rien d'une
finition. Toutes traitées en phase 1.

- **Le panneau Filtres est inutilisable sur un téléphone.** `DrawerContent` est
  une colonne flex plafonnée à `max-h-[80vh]`, mais son contenu n'avait ni
  `min-h-0` ni défilement : mesuré sur louyomb.com en 375 × 812, le panneau
  faisait **1 947 px dans une boîte de 649 px**, et « Taille disponible »,
  « Prix » et le bouton **« Voir les maillots » tombaient 367 px sous le bord de
  l'écran, hors d'atteinte**. Rien ne défilait. Le guide des tailles a le même
  défaut, invisible à 812 px de haut mais pas sur un écran de 667 px.
- **Aucun `<Toaster>` n'existait côté boutique** — seul `AdminShell` en montait
  un. Tous les `toast()` publics partaient donc dans le vide : « Ajouté au
  panier » ne s'est jamais affiché, alors que la ligne entrait bien dans le
  panier. Prérequis des toasts « Annuler », et bug à part entière.
- **`overscroll-behavior` n'était posé nulle part.** Sur Android Chrome, arrivé
  en bas des lignes du panier, un geste vers le bas de plus part dans la page et
  déclenche le pull-to-refresh. Le panier lui-même survit — il est en
  `localStorage` —, mais le panneau se referme et le visiteur est renvoyé en
  haut du catalogue. Même chose sur la galerie : passé la dernière photo, un
  balayage de plus partait dans le geste « retour » et quittait la fiche.
- **La restauration de la position de défilement** marche déjà. Vérifié le
  2026-10-15 sur louyomb.com : 1 800 px → fiche produit → retour → 1 800 px, y
  compris avec un tri dans l'URL. Rien à corriger.

---

## 4. Ce qu'on refuse, et pourquoi

| Proposition | Verdict |
| --- | --- |
| **Embla carousel** | Non. `scroll-snap` fait déjà le travail, en 0 octet. |
| **Lottie** (coche animée) | Non. `lottie-web` pèse plus de 250 Ko. Une coche se dessine en SVG avec `stroke-dasharray`, pour 0 octet. |
| **framer-motion / motion** | Non sur le catalogue et la fiche. 40 Ko et des centaines de ms de fil principal, soit exactement la fenêtre que `StaticGrid` a servi à dégager. Tout ce qui est listé ici se fait en CSS ou avec `<ViewTransition>`. |
| **Le formulaire de commande en bottom sheet** | Non, et c'est le seul point de la liste de départ à écarter franchement. `/commande` a son propre groupe de routes `(checkout)` fait exprès pour retirer la recherche, les favoris, le panier et le pied de page. Le passer en panneau lui retire son URL (donc le retour arrière du navigateur, le partage, la relance d'un panier abandonné), casse le `InitiateCheckout` du pixel qui part de cette page, et met un formulaire à cinq champs dans un conteneur qui se ferme au moindre geste vers le bas — sur un téléphone, avec le clavier ouvert. Ce qu'on garde de l'idée : **animer l'entrée de la page** (glissement directionnel, § 3.1), ce qui donne la même sensation sans rien perdre. |
| **Squelettes scintillants sur le catalogue** | Non. `StaticGrid` met les vraies cartes dans le HTML ; un squelette serait un recul. Utile seulement sur `/favoris` et sur le panneau du panier, où rien n'est prérendu. |

---

## 5. Les phases

Chaque phase est livrable seule et testable sur un téléphone. L'ordre va du
plus rentable au plus décoratif.

### Phase 1 — Les corrections qui ne sont pas des animations ✅ faite le 2026-10-15

*Pourquoi d'abord :* ce sont des pertes de commande, pas des finitions. Et les
toasts « Annuler » sont la règle n° 4 de Telegram pour quelques lignes.

1. **Les panneaux défilent.** `filter-drawer.tsx` et `size-guide.tsx` : le
   corps est devenu le défileur (`min-h-0 flex-1 overflow-y-auto`), l'en-tête et
   le pied restent en place. Vérifié : sur 375 × 812 le pied du panneau Filtres
   est désormais à 732–812 px, entièrement à l'écran ; sur un écran de 600 px le
   guide des tailles rend « J'ai compris » visible et fait défiler le tableau.
2. **`overscroll-contain`** sur ces deux défileurs, sur la liste du panneau
   panier, et `overscroll-x-contain` sur la galerie.
3. **`<ShopToaster>`** monté par `(shop)` et `(checkout)`, en chargement différé
   (`next/dynamic`, `ssr: false`), **en haut** de l'écran : la fiche produit et
   la page panier portent une barre d'achat `fixed` en bas, et un toast
   au-dessus recouvrirait « Commander ».
4. **Toasts « Annuler »** sur le retrait d'un favori (`favorite-button.tsx`) et
   sur les **deux** façons de vider une ligne du panier (`cart-lines.tsx`) : la
   corbeille, et le « − » quand la quantité est à 1. Six secondes.
5. **`restore()` dans les deux stores**, parce qu'une annulation doit rendre les
   choses *telles qu'elles étaient* : `toggle`/`add` remettaient le maillot en
   fin de liste, et la ligne de panier avec une quantité de 1. Vérifié :
   « 3 × Angleterre domicile, taille L » retiré du milieu du panier revient au
   milieu, avec ses trois exemplaires.
6. **sonner n'entre plus dans aucun chemin critique** : tous les appels passent
   par `lib/toast.ts`, qui fait `await import('sonner')` au premier toast. La
   fiche produit l'importait statiquement — ce n'est plus le cas.

Hors périmètre mais corrigé en passant : **trois locators de `e2e/parcours.spec.ts`**
étaient périmés et le test échouait avant toute modification de cette phase —
le mot-symbole en double depuis que le pied de page le porte aussi (`94f9457`),
« Sur l'axe du BRT » devenu ambigu depuis que le récapitulatif annonce la zone,
et « Confirmer ma commande » qui ne nomme que le bouton de bureau alors que le
test tourne sur un Pixel 7. Corrections côté test uniquement.

### Phase 2 — La continuité (un à deux jours)

1. `<ViewTransition name={`maillot-${id}`}>` sur la photo de la carte et sur la
   première photo de la galerie, avec `share="morph"` et `default="none"`.
2. Le **même `name` sur le bloc image de `ProductSkeleton`**, pour que la paire
   se forme même quand le fallback passe (§ 3.1).
3. Ancrage de `site-header` et de la barre d'achat collée.
4. Glissements directionnels `nav-forward` / `nav-back` via `transitionTypes`
   sur les liens, posés **dans chaque `page.tsx`** et non dans le layout.
5. `::view-transition { pointer-events: none }` pour que les appuis pendant
   l'animation ne soient pas perdus.
6. Coupure complète sous `prefers-reduced-motion`, à ajouter au bloc qui existe
   déjà dans `globals.css`.

*Mesure de contrôle obligatoire :* Lighthouse mobile sur le catalogue avant et
après. Le score est à 81, il ne doit pas bouger.

### Phase 3 — Le doigt (une demi-journée)

1. `active:scale-[0.97]` sur les pastilles de taille et sur la barre d'achat.
2. Un helper `tap()` minuscule (`navigator.vibrate?.(10)`, sous garde de
   `prefers-reduced-motion` et de l'existence de l'API) appelé sur : taille
   choisie, ajout au panier, commande envoyée. Nulle part ailleurs.

### Phase 4 — La photo (un jour)

1. Visionneuse plein écran avec vaul : tirer vers le bas pour fermer, fond qui
   s'éclaircit à mesure, balayage horizontal entre les photos (le même
   `scroll-snap` qu'aujourd'hui, repris tel quel).
2. Chargement dynamique au premier appui, comme `SizeGuide`.
3. `blurDataURL` fourni par ImageKit (`tr=w-20,bl-10`), porté par
   `getCatalog()` / `getProduct()`.

### Phase 5 — Le décor (une demi-journée)

1. Montants qui roulent sur le total du panier et la remise pack, en CSS.
2. Coche dessinée en SVG + `canvas-confetti` importé dynamiquement sur la page
   de confirmation, coupés sous `prefers-reduced-motion`.
3. Éclat sur le cœur des favoris (CSS, un pseudo-élément qui se dilate et
   s'efface).

---

## 6. Les garde-fous, à relire avant chaque commit de ce chantier

- **`transform` et `opacity` uniquement.** Animer une hauteur, une marge ou un
  `top` force un recalcul de mise en page à chaque image et compte comme
  décalage cumulé (règle déjà écrite dans AGENTS.md pour l'en-tête).
- **Aucune couleur en dur.** Uniquement les variables du thème Cosmic Night.
- **Durées courtes** : 150 ms pour une sortie, 200 à 400 ms pour une entrée ou
  un morph. Au-delà, un appui donne l'impression que l'interface réfléchit —
  c'est déjà le raisonnement écrit dans `favorite-button.tsx`.
- **`prefers-reduced-motion` à 0,01 ms, jamais `none`** : Radix attend
  `animationend` pour démonter un panneau. À `none`, le panneau reste coincé à
  l'écran.
- **Le budget JavaScript du catalogue est fermé.** Toute dépendance nouvelle sur
  cette page doit être justifiée par une mesure, pas par un ressenti.
- **Un montant ne passe jamais en `font-display`**, et toute une phrase tient
  dans un seul enfant d'un flex à `gap`.
