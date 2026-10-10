# Spot louyomb.com — 15 s, vertical

Film de 15 secondes (450 frames, **1080 × 1920**, 30 fps) sur la boutique
DakarKits, rendu avec Remotion. Projet npm autonome : il ne touche ni au
`package.json` de l'app, ni à son `node_modules`.

Format 9:16, pensé pour TikTok et les Reels. Tutoiement partout.

## Zones de sécurité

`SAFE` dans `src/theme.ts` : 250 px en haut, 350 px en bas. L'interface des
plateformes recouvre ces bandes. Le composant `<Safe>` y enferme tout ce qui
doit se lire ; le décor, lui, déborde volontiers — c'est ce qui fait tenir le
plein cadre.

**La première image porte déjà la marque et la promesse.** Pas de fondu
d'ouverture, pas d'éclat plein cadre : sur un fil, une première image vide ou
délavée est une image perdue.

```bash
cd video
npm install
npm run audio    # (re)fabrique public/audio/*.wav
npm run dev      # studio Remotion, prévisualisation image par image
npm run render   # out/dakarkits-spot-vertical.mp4
```

## Le son

Tout est synthétisé par `scripts/make-audio.mjs`, échantillon par échantillon.
Aucune banque musicale, donc **rien à faire repérer par Meta ou TikTok** — un
morceau du commerce sur une vidéo de vêtements est la première cause de
bannissement d'un compte publicitaire.

Le beat est amapiano — log drum glissant, shaker en doubles-croches, nappe
mineure — mais ses percussions sont des frappes **sabar** : le tak sec du
bâton, le gin ouvert de la main. C'est ce qui ancre le spot à Dakar plutôt
qu'à Johannesburg.

**La musique est volontairement basse** (-22 dBFS RMS en sortie de fichier,
puis 0,55 de gain) : elle est faite pour passer sous une voix off ajoutée
ensuite. Tout le dosage tient dans `MIX`, en haut de `src/Soundtrack.tsx`.

| Son | Où | Quoi |
| --- | --- | --- |
| `music` | tout du long | Le lit amapiano/sabar, 120 BPM |
| `whoosh` | 6 frames avant chaque coupe | Son sommet tombe pile sur la coupe |
| `tick` | pendant le compteur du prix | S'arrête quand le montant se pose |
| `pop` | chaque pastille, puce et chiffre | |
| `ding` | « LIVRAISON GRATUITE » | Cloche inharmonique |

Pour remplacer la musique par un morceau sous licence : déposer le fichier en
`public/audio/music.wav` et vérifier que ses temps forts tombent toutes les
30 frames. Le reste du montage ne bouge pas.

## Le découpage

Six plans, coupe franche. **Toutes les coupes sont traitées pareil** : éclat
violet, secousse caméra, déchirure en bandes et séparation RVB. Une transition
qui sortirait du lot attirerait l'attention sur elle-même plutôt que sur ce
qu'elle montre.

Les bornes sont dans `CUTS` (`src/theme.ts`), toutes multiples de 30 frames —
soit deux temps à 120 BPM. **Chaque changement de plan tombe sur un kick.**
Déplacer une borne hors de cette grille désynchronise l'image et le son.

| Frames | Plan | Ce qu'il dit |
| --- | --- | --- |
| 0–60 | `Ignition` | Marque et « +20 MAILLOTS », pleines dès la frame 0 |
| 60–150 | `Catalogue` | Le maillot du Sénégal en grand, puis le compteur |
| 150–240 | `Price` | 7 500 F CFA, barré 10 000 F, −25 %, pack |
| 240–330 | `Experience` | Le site sur un téléphone, zoom sur la fiche Maroc |
| 330–390 | `Delivery` | Livraison gratuite, paiement Wave à la remise |
| 390–450 | `Lockup` | Signature, adresse, « Lien dans la bio » |

## Ce qui vient du projet, et ce qui n'en vient pas

- **Le monogramme** est le `LOGO_PATH` de `components/shop/logo.tsx`, copié
  dans `src/components/Monogram.tsx`. C'est un tracé, donc il peut s'écrire au
  trait ; une image ne le pourrait pas. **Si le logo change, cette copie est à
  refaire à la main** — comme `app/icon.svg`.
- **Les couleurs** sont Cosmic Night en sombre, en dur dans `src/theme.ts`.
  Remotion ne lit pas les variables CSS du thème. Même dette que `icon.svg`,
  `opengraph-image.tsx` et le `themeColor` du layout : **si le thème change,
  ce fichier ne suivra pas tout seul.**
- **Les polices** respectent la règle du projet : Bebas Neue pour les gros
  titres et les montants mis en avant, Inter pour tout le reste, y compris les
  noms de maillots. Bebas n'a que des capitales.
- **Les photos de maillots** (`public/jerseys/`) sont les nôtres, tirées de
  l'ImageKit du projet. Aucune photo officielle de marque, aucune image
  générée : la règle qui protège le compte publicitaire vaut d'autant plus
  pour une vidéo destinée à Meta ou TikTok.
- **Les captures d'écran** (`public/shop-*.png`) sont celles de louyomb.com en
  sombre, prises en densité 2 avec le Chromium de Playwright déjà installé à
  la racine. Pour les refaire, voir la section suivante.

## Refaire les captures

Le plan 4 se joue en deux temps dans **un seul** téléphone, volontairement
grand : à deux maquettes côte à côte, un maillot tombait à 60 px de large et
n'existait plus pour quelqu'un qui scrolle. D'abord `shop-home-full.png`, une
capture **pleine page** qui défile — une capture au cadre ne permettrait aucun
défilement. Puis, à la frame 46, `shop-product-top.png` : la fiche du Maroc en
gros plan.

**Le cadre de la capture produit fait 380 × 660 CSS, et ce n'est pas un choix
esthétique.** 660 px est la hauteur maximale qui laisse voir le titre et le
prix du maillot tout en coupant la mention « en espèces » — vérifié par
balayage sur le site, pas estimé. Le cadre du téléphone (`PHONE_H` dans
`src/scenes/Experience.tsx`) reprend exactement ce rapport ; le changer sans
reprendre la capture laisse une bande vide sous l'écran.

**Le cadrage est un choix, pas un hasard.** Deux mentions du site contredisent
la copie du spot : la fiche produit annonce un paiement en espèces quand le
spot dit Wave, et la barre de filtres affiche le nombre de maillots publiés
quand le spot annonce « +20 ». Le défilement du téléphone de gauche démarre
donc sous la barre de filtres et s'arrête avant le pied de page, et la capture
produit est volontairement coupée avant les lignes de paiement. **Si tu
reprends ces captures, revérifie ces deux bornes** — ou mets le site à jour,
ce qui règle le problème à la source.

Si le catalogue change, reprendre les captures au même format, puis ajuster
`pageRatio` dans `src/scenes/Experience.tsx` : c'est la hauteur de l'image
divisée par sa largeur, en pixels réels.

## Ce que le film affirme

- Prix, remises et pack : la promo de lancement.
- « +20 maillots » : le stock annoncé, pas le nombre publié en ligne le
  2026-10-10, qui était de 13. Le carrousel est construit pour qu'on ne puisse
  pas compter les maillots à l'écran (voir `src/components/Carousel.tsx`), mais
  **l'écart reste à combler côté boutique.**
- Paiement Wave à la livraison : **la fiche produit du site dit encore
  « en espèces »**. À aligner.

Rien n'y qualifie un maillot d'« officiel » ni d'« authentique ».

## Notes de rendu

- Les deux colonnes du carrousel tirent dans des **moitiés disjointes** du
  catalogue. C'est la seule garantie qui tienne : les colonnes défilant en sens
  inverse, leur décalage change à chaque frame, et toute contrainte fondée sur
  l'ordre d'une pioche commune finit par être prise en défaut. Le maillot mis
  en avant est en plus retiré du carrousel — le voir passer derrière lui-même
  casserait la mise en avant.
- Le grain est une tuile de bruit de 160 px fabriquée une fois au canvas et
  déplacée à chaque frame. Un `feTurbulence` plein cadre coûtait vingt fois
  plus cher pour le même résultat.
- `Chroma` (aberration chromatique) rend trois fois son contenu. Réservé aux
  titres ; jamais plein cadre.
- `@remotion/google-fonts` charge Inter sur tous ses poids par défaut, soit
  plus de cent requêtes avant la première frame. `src/fonts.ts` ne demande que
  les cinq graisses utilisées.
