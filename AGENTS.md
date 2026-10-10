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
- que le serveur recalcule seul les montants (`lib/pricing.ts`).

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

Emplacements actuels : le mot-symbole « DakarKits » de l'en-tête et du pied de
page, et le montant du pack sur la fiche et dans le panier. Les bannières à
venir s'y ajouteront.

Piège payé le 2026-10-07 : sortir un montant dans son propre `<span>` à
l'intérieur d'un `<p className="flex gap-2">` en fait un **élément flex de
plus**, donc 8 px de gouttière avant le mot suivant. Toute la phrase doit
tenir dans un seul enfant du flex.
