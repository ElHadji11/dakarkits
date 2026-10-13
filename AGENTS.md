<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## DakarKits — règles du projet

### Toute page `/admin` doit passer par `<AdminGuard>`

Le garde du layout (`app/admin/(dashboard)/layout.tsx`) ne suffit pas. Avec
`partialPrefetching`, Next prérend le segment d'une page indépendamment de son
layout : tout ce qu'une page sait rendre sans donnée de requête part dans la
coquille statique, servie à n'importe qui, connecté ou non. Vérifié le
2026-10-06 : le contenu de `/admin` était lisible sans cookie.

Donc le corps de chaque page admin est enveloppé dans
`<AdminGuard>` (`components/admin/admin-guard.tsx`), qui lit la session dans
l'arbre de la page elle-même. Et chaque Server Action admin appelle
`requireAdmin()` de son côté — un garde de rendu ne protège pas une action.

Jamais de `'use cache'` dans `/admin`.

### Le pack est un barème, pas un seul palier

Un prix global **par nombre de maillots**, une ligne par palier dans
`pack_tiers` : 2 pour 13 000 F, 3 pour 19 500 F. Les deux sont réglables dans
`/admin/réglages`, tailles 2 à 6 (`PACK_TIER_SIZES`).

C'était un couple `pack_size` / `pack_price` sur `settings`, donc un seul
palier, et le troisième maillot retombait à son prix plein : 21 000 F les
trois, soit **7 000 F le maillot contre 6 500 F dans la paire**. Le troisième
coûtait plus cher que les deux premiers. Décision du 2026-10-10 : le prix au
maillot ne remonte jamais.

`ladderIssues()` (`lib/pricing.ts`) fait respecter ça à l'enregistrement — un
pack plus grand ne peut ni coûter moins cher en tout, ni revenir plus cher au
maillot que celui d'en dessous. `calculatePricing` s'en passerait, il prend
toujours le moins cher pour le client ; mais la fiche produit et le panier
*annoncent* les paliers, et annoncer une offre que personne n'a intérêt à
prendre est pire que ne rien annoncer.

Le calcul est une programmation dynamique sur les prix triés décroissants : les
maillots les plus chers vont dans les mêmes groupes, c'est ce qui fait gagner
le plus, et un palier n'est jamais facturé au-dessus de la somme réelle. Un
panier à prix mixtes reste donc cohérent.

**Si tu ajoutes un palier, rien à écrire ailleurs** : `packLadder()`
(`lib/shop-types.ts`) est la source unique de la phrase « 2 maillots au choix
pour 13 000 F, 3 pour 19 500 F », et la relance du panier sort de
`nextPackStep()`. Elle compare ce que coûteraient `n + m` maillots au barème et
ce qu'ils coûteraient en payant les ajoutés au prix affiché — donc elle sait
encore proposer le troisième à qui en a déjà deux, ce que l'ancien pack ne
savait pas faire.

### Le gratuit s'arrête à l'axe du BRT ; ailleurs, c'est un forfait

La boutique promettait « Livraison gratuite partout à Dakar ». La livraison est
désormais **gratuite le long du BRT, de Papa Gueye Fall (Petersen) à la
Préfecture de Guédiawaye : les 23 stations de la ligne, et environ 500 m autour
de chacune**. Ailleurs dans Dakar, elle coûte **2 000 à 3 000 F selon la
distance**, ajoutés au total. Décision du 2026-10-13 : un seul livreur ne tient
pas une promesse à l'échelle de l'agglomération, et une adresse hors de portée
se découvre sinon au pire moment — colis en main, devant la porte, au moment
d'encaisser.

Tout part de `lib/constants.ts`, et **rien ne se réécrit ailleurs** :

- `BRT_STATIONS` est la liste des 23 stations, dans l'ordre du trajet.
  `BRT_STATION_COUNT` s'en déduit : le « 23 » des phrases n'est écrit nulle
  part à la main. Les CGV l'énumèrent, le formulaire de commande la déplie —
  deux listes recopiées auraient fini par diverger, et c'est sur celle des CGV
  qu'on s'appuierait le jour d'un désaccord.
- `OUTSIDE_ZONE_FEE` porte l'intervalle. Les deux bornes sont toujours
  annoncées : « à partir de 2 000 F » n'engage à rien, « 3 000 F » fait fuir
  celui qui habite à deux rues de la ligne.
- `DELIVERY_ZONE` (trois mots, pour le bandeau), `DELIVERY_ZONE_NOTICE` (la
  notice) et `DELIVERY_ZONE_OUTSIDE` (le prix d'en dehors) sont les trois
  phrases ; `deliveryPromise()` (`lib/shop-types.ts`) dit *combien* et
  `DELIVERY_ETA` *quand* — celle-ci ne nomme plus la ville.

`<DeliveryZoneNotice>` (`components/shop/delivery-zone.tsx`) rend les deux
phrases au pied de page (donc sur tout le catalogue), sur la fiche produit,
dans le panier et sur sa page, et sur la confirmation. **Pas de carte, et les
23 noms seulement là où on en a besoin** : `<BrtStationList>` est un `<details>`
natif — zéro octet de JavaScript — déplié sous le choix de zone.

**Le client déclare sa zone, le serveur la facture.** `<DeliveryZoneChoice>`
pose la question en deux cartes à cocher, juste sous le champ adresse ; le
récapitulatif se met à jour au doigt. Une case cochée par défaut aurait été une
réponse que personne n'a donnée, mais deux cartes vides auraient coûté un tap à
tout le monde : le défaut est la zone, et ce qui le rattrape est la liste des
stations dépliable et l'appel de confirmation.

La zone remonte dans `orderSchema` (`lib/validation/order.ts`), puis dans
`calculatePricing(lines, settings, zone)` : **le navigateur n'envoie jamais un
montant**, seulement cette étiquette. `shippingRange()` garantit au passage que
sortir de la zone ne coûte jamais moins que d'y rester — même règle que le
barème des packs, où le prix au maillot ne remonte jamais.

**Une commande fige un entier, pas un intervalle.** `orders.shipping_fee` porte
le plancher, `orders.delivery_zone` (colonne qui existait déjà, inutilisée) dit
s'il y avait un intervalle, et `storedShippingMax()` relit le plafond. Pas de
colonne de plus pour un montant qui sera de toute façon arrêté au téléphone :
l'admin et la notification affichent « hors zone BRT, à fixer à l'appel ».

Le rayon de 500 m et l'intervalle sont annoncés « environ » et « selon la
distance », comme les mesures du guide des tailles : personne ne mesure 500 m
au GPS devant un portail. Mais les CGV s'engagent sur le **plafond** — jamais
plus de 3 000 F, et annulation sans frais si la distance devait coûter plus.
Si `OUTSIDE_ZONE_FEE` bouge, l'article 8 bouge avec.

**Reste à l'ancienne promesse** : le reel (`video/src/reel/`, `video/src/scenes/Delivery.tsx`)
et les légendes Instagram (`instagram-posts/legendes.md`, dont `post-06.png` qui
porte « Livraison gratuite à Dakar » en dur dans l'image). Une publicité qui
promet plus que le site est le genre de contradiction qui se paie en refus à la
livraison — à reprendre avant publication.

### Autres invariants

- Montants en francs CFA, entiers. Jamais de flottant.
- Les lignes de commande figent `unit_price` et `title`.
- `product_sizes` : zéro ligne = maillot sans tailles ; des lignes toutes
  `available = false` = épuisé. Décocher conserve la ligne, ne la supprime pas.
- Uniquement les variables du thème Cosmic Night, aucune couleur codée en dur.
- Ne jamais décrire un maillot comme « officiel » ou « authentique ».

### Un formulaire rejeté doit rendre ce qui a été saisi

React 19 réinitialise les champs non contrôlés dès qu'une action se termine :
une erreur de validation effaçait tout ce qui venait d'être tapé. Sur un
téléphone, c'est rédhibitoire.

Chaque Server Action de formulaire renvoie donc `values` dans son `ActionState`
(`submittedValues()` dans `lib/action-state.ts`), et le formulaire les relit en
`defaultValue`. À reproduire pour le formulaire de commande (phase 4) et les
réglages (phase 5). L'état porté par React — tailles, photos, selects — survit
déjà de lui-même.

### La boutique est statique, l'admin ne l'est pas

Les pages boutique sont prérendues et servies par le CDN : `getCatalog()` et
`getShopSettings()` sont en `'use cache'` avec `cacheTag('catalog')` et
`cacheTag('settings')`. **Toute mutation admin doit appeler `updateTag`**,
sinon la boutique garde l'ancien contenu jusqu'à 30 jours. Une insertion SQL
directe ne rafraîchit rien : il faut redémarrer `next dev` pour la voir.

Le catalogue complet est remis une seule fois au client par le layout boutique
(`CatalogProvider`). C'est ce qui rend filtres, tri, recherche, favoris et
panier instantanés en 4G. Tient jusqu'à ~200 maillots publiés ; au-delà,
repasser le filtrage côté serveur.

`params` et `searchParams` ne s'attendent jamais au niveau d'une page : l'await
va derrière un `<Suspense>`, sinon Next signale que la navigation ne sera pas
instantanée.

Le panier ne stocke **jamais** de prix : seulement productId, taille et
quantité. Les prix viennent du catalogue pour l'affichage et sont recalculés
par le serveur à la commande.

### Le LCP du catalogue se joue sur le fil principal, pas sur le réseau

Mesuré le 2026-10-07 : image téléchargée en 263 ms, mais affichée à 2 s —
`elementRenderDelay` à 1999 ms. Précharger l'image n'y change rien ; c'est
l'hydratation qui bloque le rendu.

La grille interactive lit `searchParams`, donc elle ne peut pas être prérendue.
Sans précaution, la page partait **sans aucune balise `<img>`** et le navigateur
ne découvrait l'image qu'après le JavaScript. Le correctif : `StaticGrid`, la
grille rendue côté serveur, sert de `fallback` au `<Suspense>` de `CatalogView`.
Les vraies cartes sont donc dans le HTML dès le premier octet. Catalogue passé
de 73 à 81 en Lighthouse mobile.

Pour aller au-delà, le levier restant est de réduire le JavaScript hydraté sur
le catalogue — c'est-à-dire repasser le filtrage côté serveur, ce qui revient
sur un choix validé. Les panneaux lourds (vaul, Radix Dialog) sont déjà chargés
à la demande, au premier clic.

### Les photos sont les nôtres, jamais celles d'Internet

Ne jamais reprendre une photo produit officielle (Nike, adidas, club,
revendeur) ni en faire générer une par une IA pour illustrer un maillot. Trois
raisons, par ordre de gravité :

1. **Le compte publicitaire.** Meta et TikTok détectent automatiquement les
   visuels de marque. C'est la première cause de bannissement d'une boutique de
   vêtements. Sans publicité, cette boutique n'a aucun trafic.
2. **Le taux de refus.** Nous vendons des répliques. La photo studio officielle
   montre autre chose : le client compare à la livraison et refuse.
3. La règle du brief : ne jamais laisser entendre « officiel » ou
   « authentique ». Une photo officielle le dit sans mot.

**Ce qui marche**, vérifié le 2026-10-07 : un maillot déballé, posé à plat ou
suspendu, photographié de face à la lumière du jour. `e-bgremove` enlève sans
difficulté un carrelage, des sandales et des pieds. Un maillot resté sous
emballage ressort techniquement détouré mais illisible — plis, reflets,
étiquette en travers : inutilisable en image principale. L'emballé convient
comme photo secondaire (« livré neuf, sous emballage »).

### Le logo est un tracé, pas une image

Le fichier d'origine est un rendu : la marque n'y occupe que 320 × 193 px. Ne
jamais l'agrandir pour fabriquer une icône — elle a été vectorisée une fois
(contours relevés au sous-pixel, puis simplifiés), vérifiée par rastérisation
contre l'original : zéro pixel en désaccord franc.

La source unique est `LOGO_PATH` dans `components/shop/logo.tsx`. L'en-tête et
`app/opengraph-image.tsx` l'importent. **`app/icon.svg` en garde une copie** —
un fichier statique ne peut rien importer — donc si le logo change, ce fichier
est à refaire à la main, ainsi que `app/favicon.ico` et `app/apple-icon.png`.

Trois fichiers codent des couleurs en dur, et ce sont les seuls autorisés à le
faire : `app/icon.svg`, `app/opengraph-image.tsx` et le `themeColor` de
`app/layout.tsx`. Ni un `.svg` statique, ni Satori, ni une balise `meta` ne
lisent les variables CSS du thème. Les valeurs sont celles de Cosmic Night en
sombre, relevées sur l'app en marche : fond `#0F0F1A`, texte `#E2E2F5`, texte
atténué `#A0A0C0`, primary `#A48FFF`. **Si le thème change, ces trois fichiers
ne suivront pas tout seuls.**

Piège payé le 2026-10-07 : un `--` dans un commentaire XML est interdit. Le
commentaire de `icon.svg` disait « --background et --primary » ; le navigateur
refusait silencieusement de décoder le SVG et le favicon n'apparaissait pas,
sans la moindre erreur en console.

Les pastilles d'icône ont deux réglages distincts : onglet de navigateur, coins
arrondis à 22 % et marque à 86 % de la largeur ; iOS, carré plein sans
arrondi — le système applique son propre masque — et marque à 70 %, pour que ce
masque ne morde pas dedans.

### Les pages juridiques décrivent le code, pas un modèle

`/cgv` et `/confidentialite` ont été écrites après un audit du code, et chaque
affirmation y correspond à un comportement réel. **Si tu changes ce qui est
collecté, les destinataires, la conservation ou le parcours de commande, ces
deux pages bougent dans le même commit.** Elles affirment notamment :

- que l'IP est conservée en clair et qu'aucune suppression automatique n'existe
  (`lib/rate-limit.ts`) ;
- qu'aucun bouton de suppression n'existe et que les demandes sont traitées à
  la main — vrai tant qu'il n'y a aucun `delete(orders)` dans l'admin ;
- que le téléphone part haché en SHA-256 vers Meta mais l'IP en clair
  (`lib/meta.ts`) ;
- que le serveur recalcule seul les montants (`lib/pricing.ts`) ;
- que la livraison est gratuite sur l'axe du BRT, ses 23 stations et environ
  500 m autour de chacune, et facturée 2 000 à 3 000 F ailleurs dans Dakar —
  l'article 8 des CGV, `BRT_STATIONS` et `OUTSIDE_ZONE_FEE` doivent dire la
  même chose, plafond compris.

`LegalIdentity` dans `components/shop/legal-text.tsx` est la **source unique**
de l'identification du vendeur, rendue par les deux pages. C'est une
**entreprise individuelle, pas une société** : pas de personne morale
distincte, l'exploitant contracte en son nom propre. Ne jamais réécrire ce bloc
dans une page.

**Dette ouverte** : la politique annonce une conservation de trois ans et
aucune purge n'est implémentée. Annoncer une durée qu'on n'applique pas est
pire que ne rien annoncer — à corriger par une tâche planifiée sur `orders` et
`rate_limits`, ou en changeant le texte.

### Deux polices, deux jetons — ne pas les confondre

Inter pour tout le texte, **Bebas Neue pour les gros titres uniquement**. Bebas
n'a qu'une graisse (`font-semibold` n'y fait rien) et **ne contient que des
capitales** : jamais pour un nom de maillot, un prix de carte ou du texte
courant.

Le jeton est `--font-display` (classe `font-display`). **Ne jamais réutiliser
`--font-heading` pour ça** : il est déjà câblé dans `CardTitle`, `Drawer`,
`Sheet` et `AlertDialog` de shadcn. Le repointer mettrait en capitales
condensées le titre du panier, celui du panneau Filtres et les titres de
cartes — y compris les noms de produits dans l'admin.

Emplacements actuels : le mot-symbole « DakarKits » de l'en-tête, du pied de
page et du tunnel de commande, et le titre de la bannière d'accueil.

**Aucun prix, nulle part.** Le montant du pack y était, sur la fiche et dans le
panier — et nulle part ailleurs : deux prix condensés au milieu d'un catalogue
entier en Inter se lisaient comme une erreur de police, pas comme une mise en
avant. Bebas n'a pas non plus de chiffres tabulaires, donc un prix écrit avec
ne s'aligne pas en colonne. Un montant se met en avant par son poids et sa
taille, et il reste en Inter.

Piège payé le 2026-10-07 : sortir un montant dans son propre `<span>` à
l'intérieur d'un `<p className="flex gap-2">` en fait un **élément flex de
plus**, donc 8 px de gouttière avant le mot suivant. Toute la phrase doit
tenir dans un seul enfant du flex.

### Un maillot n'a qu'un nom, et il est composé à l'affichage

`productName()` (`lib/shop-types.ts`) rend « FC Barcelone · Domicile 2026/27 »
à partir de l'équipe liée, du type de maillot et de la saison. **Ne jamais
afficher `product.title` directement** : carte, fiche, recherche, panier,
`<title>`, aperçu OpenGraph et JSON-LD passent tous par `productName`.

Le titre enregistré porte les traces de chaque saisie des derniers mois :
« Barcelona » sous une équipe nommée « FC Barcelone », « Chelsea » répété en
titre et en sous-titre, « Aston villa third » en minuscules et en anglais.
Composer le nom au rendu rend ces trois cas impossibles à l'écran, sans
dépendre de l'état de la base.

Le format vit dans `composeName()`, et trois appelants le partagent : l'affichage,
le titre proposé par l'IA (`composeTitle` dans `lib/ai/suggest.ts`) et le script
de reprise `npm run db:rename-products` (liste par défaut, `-- --write` pour
appliquer). Si le format change, il change là.

`products.title` reste en base et reste le filet : un maillot sans équipe liée
n'a pas de nom à reconstruire. Les lignes de commande continuent de le figer —
mais elles figent désormais le **nom affiché** (`nameOf` dans l'action de
commande), parce que c'est sur le bon de commande que quelqu'un va chercher le
maillot dans le stock.

Le sous-titre d'une carte est la ligue, et rien d'autre (`productSubtitle`).
Une sélection nationale n'en a pas : une carte sans sous-titre est normale.

### Le tunnel de commande est un groupe de routes à part

`/commande` vit sous `app/(checkout)/`, avec son propre layout : le mot-symbole,
le formulaire, le bouton. Ni recherche, ni favoris, ni panier, ni pied de page.

Un layout imbriqué ne peut pas *retirer* ce que son parent rend — d'où le groupe
séparé et non un `layout.tsx` sous `(shop)/commande`. Le layout garde
`CatalogProvider` (le panier ne stocke aucun prix, le récapitulatif les lit dans
le catalogue) et `MetaPixel` (`InitiateCheckout` et `Purchase` partent d'ici).
`AttributionCapture` n'y est pas : les `utm_*` sont relevés à l'atterrissage.

### L'en-tête s'efface au défilement, sans état React

`useHideOnScroll` (`hooks/use-hide-on-scroll.ts`) écrit `data-hidden` sur le
nœud par `ref`, et le CSS fait le reste (`data-[hidden=true]:-translate-y-full`).
**Ne jamais remplacer ça par un `useState`** : une mise à jour d'état par image
de défilement re-rendrait `SearchBox` et `CartButton` sur la page dont le LCP se
joue déjà sur le fil principal.

Même règle pour tout mouvement ajouté ici : `transform` et `opacity`
uniquement — animer une hauteur, une marge ou un `top` force un recalcul de
mise en page à chaque image et compte comme décalage. Le CSS coûte ~0 octet ;
une bibliothèque d'animation coûterait 20 à 40 Ko *et* quelques centaines de
millisecondes de fil principal, exactement dans la fenêtre que `StaticGrid` a
servi à dégager.

`@media (prefers-reduced-motion: reduce)` dans `globals.css` coupe tout — à
0,01 ms et non à `none`, parce que Radix attend `animationend` pour démonter un
Drawer. À `animation: none`, le panneau Filtres reste coincé à l'écran.

### Une seule échelle d'espacement : 8 / 16 / 24 / 32

Soit `2`, `4`, `6`, `8` en Tailwind. Pas de `3`, pas de `5`, pas de `1.5` pour
de la mise en page — ils restent admis pour un décalage d'icône. Rayon des
cartes : le jeton `--radius-card` (16 px), classe `rounded-card`.

Les gardes au sol sont portées par **un seul** élément : le pied de page a
`pb-24` sur téléphone pour la barre d'achat collée, et les pages n'ajoutent
plus la leur. Les deux s'additionnaient — d'où le grand vide à la fin de la
fiche produit.

### La bannière d'accueil est réglable, et sa photo est forcément la nôtre

Cinq colonnes sur `settings` (`hero_*`), un bloc dans `/admin/réglages`, rendue
par la seule page d'accueil — pas par le layout : sur Clubs, Sélections et Rétro
elle ne serait que 200 px à faire défiler.

Deux contraintes que la validation fait respecter (`app/admin/_actions/settings.ts`) :

- `hero_href` est un chemin interne. `//evil.example` est une URL
  protocol-relative que le navigateur suit vers l'extérieur, et une bannière
  plein écran est le dernier endroit où ça doit pouvoir arriver.
- `hero_image_url` passe `isOwnUrl()`, donc une image de notre ImageKit. C'est
  la règle sur les photos appliquée là où elle coûte le plus cher : la bannière
  est le premier visuel qu'un robot publicitaire voit du site.

Laissée vide, la bannière prend la photo du maillot le plus récent du lien visé
(`fallbackImage` dans `components/shop/shop-hero.tsx`) — donc une des nôtres, et
elle suit les arrivages toute seule.

Elle est rendue **au-dessus** du `<Suspense>` du catalogue : son `<img>` part
dans la coquille statique et devient le LCP de l'accueil, d'où le `priority`.
Rendue côté client, elle reproduirait le défaut corrigé le 2026-10-07.

### Le guide des tailles est annoncé indicatif, exprès

`SIZE_GUIDE` (`lib/constants.ts`) donne des mesures à plat « à 2 cm près ».
Les répliques viennent de plusieurs fournisseurs : deux « L » ne tombent pas au
même centimètre. Un tableau présenté comme exact fabrique un motif de refus à
la livraison, ce qui coûte plus cher qu'une vente manquée. **Si ces chiffres
sont mesurés un jour sur le stock réel, c'est là qu'ils vont — et la mention
« indicatives » reste tant qu'un seul fournisseur n'est pas garanti.**
