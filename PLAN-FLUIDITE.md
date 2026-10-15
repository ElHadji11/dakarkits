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

### 3.1 Aucune transition d'élément partagé — le manque n° 1 — ✅ fait (phase 2)

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
> consigne. Reconfirmée le jour même, à l'ouverture de la phase 4 : celle-ci
> a donc été livrée sans visionneuse. Le reste du § est conservé pour le jour
> où la question revient.

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

### 3.3 Retour au doigt incomplet, et zéro vibration — ✅ fait (phase 3)

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

### 3.5 Images sans montée progressive — ✅ fait (phase 4)

`placeholder="blur"` n'est utilisé nulle part, et **ce n'est pas un oubli
anodin** : le loader ImageKit est personnalisé (`lib/image-loader.ts`), donc
Next ne peut pas fabriquer de `blurDataURL` tout seul pour une image distante.
Il faut le fournir, et ImageKit sait le produire (`tr=w-20,bl-10`) — soit une
vignette floue de quelques centaines d'octets, à poser au niveau de
`getCatalog()` pour qu'elle voyage avec le produit.

Sur le catalogue l'effet sera discret (les cartes sont déjà dans le HTML), mais
sur la fiche produit et la visionneuse plein écran c'est exactement le « flou
puis net » de Telegram.

### 3.6 Les montants sautent — ✅ fait (phase 5)

Le total du panier, la remise pack et la relance `nextPackStep()` passent d'une
valeur à l'autre d'un coup. Les chiffres tabulaires sont déjà en place, donc le
terrain est prêt. À faire **en CSS**, pas avec une bibliothèque de compteur.

Attention à la règle du projet : **aucun prix en `font-display`**, et pas de
montant sorti dans son propre `<span>` à l'intérieur d'un flex à `gap` (le piège
du 2026-10-07 — 8 px de gouttière parasites).

### 3.7 La confirmation de commande ne célèbre rien — ✅ fait (phase 5)

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

### Phase 2 — La continuité ✅ faite le 2026-10-15

*Vérifié dans Chromium 153 (375 × 812, build de production, base locale), en
enregistrant chaque `startViewTransition` : ses types, les noms animés et la
durée de chaque animation.*

1. **La photo glisse de la carte à la fiche.** `<KitPhoto>`
   (`components/shop/kit-photo.tsx`) porte le nom sur la carte et sur la
   première photo de la galerie, avec `share="morph"` et `default="none"`.
   Le nom est construit sur le **slug** et non sur l'`id`
   (`kitPhotoName`, `lib/view-transitions.ts`) : le squelette ne connaît que
   l'URL. Vérifié aussi de fiche à fiche, depuis « Dans le même esprit ».
2. **Le squelette porte le même nom** (`components/shop/product-skeleton.tsx`,
   client, slug lu par `useParams`). Sur une navigation qui passe par le
   fallback, la photo glisse jusqu'au bloc gris, puis le bloc gris cède la
   place à la photo au même endroit : deux transitions enregistrées, toutes
   deux sur `maillot-<slug>`.
3. **En-tête et barre d'achat ancrés** : `site-header` (porté aussi par
   l'en-tête du tunnel, pour qu'ils se relaient sans fondu) et `barre-achat`
   (fiche et page panier).
4. **Glissements `nav-forward` / `nav-back`** : `<PageTransition>` dans
   chaque `page.tsx` (dans `LegalArticle` pour les deux pages juridiques,
   plutôt que de réindenter trois cents lignes). On avance vers un maillot,
   les favoris, la commande ; on revient par les logos et « Voir
   les maillots ». Les onglets, la bannière et les liens légaux sont latéraux
   et ne glissent pas.
5. `::view-transition { pointer-events: none }`.
6. **Mouvement réduit** : vérifié, toutes les animations à 0,01 ms.

Trois surprises de la mesure, toutes corrigées :

- **Entre la boutique et le tunnel, rien ne glissait.** `(shop)` et
  `(checkout)` n'ont pas le même layout : en passant de l'un à l'autre,
  `<main>` est réinséré, et React n'anime pas un `<ViewTransition>` placé sous
  du DOM fraîchement inséré. Un `<PageTransition>` de plus en haut de chaque
  layout de groupe prend le relais — dans ce seul cas, puisqu'à l'intérieur
  d'un groupe le layout survit et ne joue jamais.
- **La fiche jouait un morph à son premier chargement.** Le HTML arrive
  squelette d'abord, et React 19.2 anime ce relais de streaming : avec le nom
  sur le squelette, la photo du LCP glissait pendant le premier affichage. Le
  squelette ne prend son nom qu'après l'hydratation (`useHydrated`). Vérifié :
  plus aucune transition au chargement direct de `/`, `/clubs`, d'une fiche,
  de `/panier` ou de `/cgv`.
- **Changer d'onglet faisait glisser toute la grille**, chaque maillot présent
  sur les deux pages formant une paire. Une capture par carte, hors écran
  comprises, sur un catalogue qui monte à 200 maillots : les cartes ne
  glissent que sur une navigation typée (`onlyWhenNavigating`). Un onglet ne
  fait plus que le fondu par défaut du navigateur, une seule capture.

Un choix de plus, et une limite :

- **La grille statique ne porte aucun nom** (`shareTransition={false}`) :
  remplacée par la grille interactive à l'hydratation, elle aurait déclenché
  une transition sur la page du LCP. Une carte tapée avant la fin de
  l'hydratation ouvre la fiche sans glissement.
- **Le bouton retour du navigateur ne déclenche aucune transition** — ni
  glissement, attendu puisqu'il n'a pas de type, ni morph, contrairement à ce
  qu'annonce le guide de Next. Mesuré, pas corrigé : rien de cassé, la page
  change simplement d'un coup, comme avant.

*Mesure de contrôle* : Lighthouse mobile sur le catalogue, cinq passes avant
et après, sur le même poste. **Le chiffre de 81 n'est pas reproductible
ici** : polices Google bloquées, base de test à douze maillots, et un Chromium
sans GPU dont le LCP varie de 2,4 à 8 s d'une passe à l'autre. La médiane
n'a pas bougé au-delà de ce bruit (5,6 s avant, 3,9 s après), TBT 0 et
CLS 0 des deux côtés, JavaScript +0,9 Ko (0,4 %). **À refaire sur
louyomb.com après déploiement**, où le 81 a été mesuré.

### Phase 3 — Le doigt ✅ faite le 2026-10-15

1. **Les pastilles de taille s'enfoncent** : `active:scale-[0.97]`, et
   `transition duration-150` à la place de `transition-colors`. C'est l'appui
   qui précède « Commander » et il n'avait aucun retour. Même idiome que
   `FavoriteButton`. Une pastille indisponible est `disabled`, donc elle ne
   bouge pas.
2. **Les deux barres d'achat aussi** — la fiche et la page panier, qui portent
   déjà le même nom de transition. Avec `duration-150` par-dessus le
   `duration-500` de la variante `cta` : cette demi-seconde existe pour le
   dégradé qui glisse au survol, et un enfoncement étalé sur elle donne un
   bouton mou. Ces barres n'existent que sur téléphone, où il n'y a pas de
   survol à animer de toute façon.
3. **`tap()`** (`lib/tap.ts`) : 10 ms, coupée sous `prefers-reduced-motion`
   (préférence relue à chaque appel, donc elle suit le réglage sans
   rechargement) et absente là où l'API l'est — iOS Safari ne l'implémente pas
   du tout, c'est une amélioration progressive pour le parc Android visé.
4. **Trois moments, et nulle part ailleurs** : la taille choisie, l'ajout au
   panier, la commande envoyée. « Commander maintenant » vibre aussi, parce
   que ce bouton ajoute au panier avant de naviguer — sans quoi la barre du
   bas aurait fait vibrer son petit bouton secondaire et pas le gros.
   L'envoi est pris sur le `<form>` et non sur ses deux boutons : React
   appelle `onSubmit` avant l'action, donc la vibration ne dépend pas de
   l'aller-retour serveur.
5. **Elle part avant le reste** dans `addToCart` : des trois retours de cet
   appui, c'est le seul qui ne coûte ni un rendu ni le chargement de sonner.

**Non vérifié** : la vibration demande un vrai Android et l'enfoncement un
doigt — rien de tout ça ne se voit dans un navigateur de bureau. À contrôler
au prochain passage sur un appareil.

### Phase 4 — La photo ✅ faite le 2026-10-15, sans la visionneuse

**La visionneuse plein écran n'en fait pas partie** : le § 3.2 l'a écartée le
même jour, et la consigne a été reconfirmée avant d'écrire une ligne. Ce qui
restait de la phase, c'est le flou d'attente.

1. **`blurDataURL` fourni par ImageKit** — `blurDataUrl()` dans
   `lib/imagekit.ts`, transformation `w-20,bl-10,q-50,f-webp`, inliné en data
   URI pour qu'il ne coûte aucune requête au navigateur. `f-webp` et non
   `f-jpg` : nos photos sont détourées, un JPEG leur collerait un fond.
2. **Sur la fiche produit, pas dans `getCatalog()`** — contrairement à ce
   qu'annonçait le § 3.5. Le catalogue entier est remis au client par le
   layout boutique : à ~500 octets de base64 par maillot, 200 maillots
   ajouteraient ~100 Ko au payload de la page dont le LCP se joue sur le fil
   principal, et ce pour flouter des cartes que `StaticGrid` a déjà peintes.
   Le budget JavaScript du catalogue est fermé ; la fiche, elle, ne paie que
   ses propres photos.
3. **La première photo seulement.** C'est celle qu'on attend, et celle qui
   arrive en glissant depuis la grille ; les suivantes restent hors écran
   jusqu'au premier balayage. Une vignette par maillot, c'est aussi une seule
   requête ImageKit par maillot au build, où `generateStaticParams` prérend
   tout le catalogue.
4. **`objectFit` passe en style inline** sur cette image : Next relit ce style
   pour poser le `background-size` de la vignette. En classe `object-contain`
   il ne le voit pas, prend `cover`, et le flou déborde là où la photo, elle,
   sera contenue.
5. **Jamais de `fetch` sans garde** : `blurDataUrl()` exige `isOwnUrl()`,
   plafonne la réponse à 4 Ko, coupe à 2 s et rend `null` à la moindre
   contrariété — une fiche sans flou reste une fiche. Chercher `[blur]` dans
   les logs si le flou disparaît partout à la fois.

**Non vérifié** : aucun `next build` n'a été lancé ici, donc `blurDataUrl()`
n'a jamais tourné contre ImageKit, et le « flou puis net » ne se voit de toute
façon que sur une connexion lente. À regarder au premier déploiement, en 4G
bridée.

### Phase 5 — Le décor ✅ faite le 2026-10-15

1. **Les montants roulent** — `.roll-in` dans `globals.css`, `Amount` dans
   `cart-summary.tsx` : 200 ms, `transform` et `opacity`. Le déclencheur est
   une `key` égale à la valeur : React remonte le `<span>`, l'animation
   repart, et un montant qui ne change pas ne joue jamais. Pas d'état, pas
   d'effet, aucune bibliothèque de compteur.
   **Les quatre lignes roulent, pas seulement deux** : sous-total, remise,
   livraison et total changent ensemble quand on ajoute un maillot, et n'en
   animer que deux se serait lu comme un défaut.
   La relance pack roule **en entier**, paragraphe compris, parce que c'est la
   phrase qui change (« ajoute un maillot » → « ajoute 2 maillots ») : deux
   chiffres animés au milieu d'un texte immobile se lisent comme un bug. Sa
   `key` est le palier visé, donc la même offre ne se rejoue pas.
2. **La coche se dessine** : SVG et `stroke-dasharray`, zéro octet de
   JavaScript — le cercle en 400 ms, le trait ensuite en 250 ms. Les confettis
   (`canvas-confetti`, 25 Ko bruts ≈ 8 Ko gzippés) arrivent par un import
   dynamique **après** le rendu : personne ne les télécharge avant d'avoir
   commandé, et pas du tout sous `prefers-reduced-motion`, la préférence étant
   lue avant l'import et pas seulement passée à la bibliothèque.
   Leurs couleurs sont celles du thème, passées par un canvas qui les parse et
   les resérialise : canvas-confetti ne lit que l'hexadécimal, et un `oklch()`
   du thème en ressortirait en bouillie. Si rien n'est convertible, la
   bibliothèque garde ses couleurs — des confettis un peu moins à la charte
   valent mieux que des confettis noirs.
3. **L'éclat du cœur** : un anneau en pseudo-élément qui se dilate et
   s'efface, 400 ms. `data-burst` est posé sur le nœud par `ref` au clic et
   retiré à `animationend` — même idiome que `data-hidden` dans
   `useHideOnScroll`, et pour la même raison : un état React ici re-rendrait
   chaque carte du catalogue. **Au clic et non sur `aria-pressed`**, sinon
   tous les favoris déjà enregistrés éclateraient ensemble à l'hydratation. À
   l'ajout seulement : le retrait a déjà son toast « Annuler ».

Une entorse assumée au garde-fou : `stroke-dashoffset` n'est ni `transform` ni
`opacity`. Elle ne déclenche aucun calcul de mise en page, et elle repeint un
SVG de 48 px sur la seule page du site qui n'a aucun enjeu de LCP.

**Non vérifié** : ni les confettis ni l'éclat n'ont été vus tourner — aucun
build lancé ici. Le code est typé et lint-propre, ce qui ne dit rien d'une
animation.

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
