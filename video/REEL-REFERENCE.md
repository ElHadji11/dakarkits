# DakarKits — reel 9:16 · fiche de référence

> **À lire d'abord dans toute nouvelle conversation qui touche au reel.**
> Écrit le 2026-10-13, repris le 2026-10-13 au soir quand l'accroche est
> devenue un paramètre. Décrit le film tel qu'il est rendu aujourd'hui, les
> assets qu'il consomme, d'où ils viennent, et ce qu'il ne faut pas refaire.
>
> Les règles produit (prix, pack, photos, typo, pages légales) sont dans
> `../AGENTS.md` et restent prioritaires sur ce fichier.

---

## 1. Le film en une page

Une boutique de maillots à Dakar. Le film montre le produit et le prix avant
de dire son nom, fait passer une vraie commande à l'écran, et signe à la fin.

| | |
|---|---|
| **Format** | 1080 × 1920 (9:16), 30 fps |
| **Durée** | 660 frames = **22,0 s** |
| **Compositions** | 6 — trois accroches (`lion`, `price`, `market`) × deux fins (organique, publicité) |
| **Ce qui change** | les **deux premières secondes**, la voix off et le lit musical. Rien d'autre. Jamais deux montages. |
| **Sorties** | `out/dakarkits-reel{,-prix,-marche}{,-ad}-9x16.mp4` |
| **Langue** | français, registre dakarois |
| **Musique** | 120 BPM, synthétisée en code, deux lits |

### Le découpage

Les bornes vivent dans `src/reel/timeline.ts` (`BEATS`). **Toutes sont des
multiples de 30**, donc chaque coupe tombe sur un temps fort. La musique est
écrite sur les mêmes nombres : déplacer une borne hors de cette grille
décolle le montage du son.

| # | Plan | Frames | Secondes | Contenu |
|---|---|---|---|---|
| 0 | `hook` | 0–60 | 0–2 | **L'accroche — le seul plan qui change d'une version à l'autre.** Voir §1b. |
| 1 | `parade` | 60–210 | 2–7 | Trois maillots plein cadre + prix : Sénégal, Maroc, FC Barcelone. **Aucune marque.** |
| 2 | `search` | 210–270 | 7–9 | `01 CHERCHE` — on tape « barca », le résultat tombe |
| 3 | `pick` | 270–330 | 9–11 | `02 CHOISIS` — taille M, barème du pack |
| 4 | `fill` | 330–450 | 11–15 | `03 COMMANDE` — trois champs, bouton pressé |
| 5 | `done` | 450–540 | 15–18 | « C'est commandé / Rien à payer maintenant » |
| 6 | `endcard` | 540–660 | 18–22 | Monogramme, DAKARKITS, LOUYOMB.COM, **+32 maillots · Dakar**, le lion en bas à droite |

Le plan `hook` fait **exactement une mesure** (60 frames à 120 BPM = 2 s). Il a
été inséré devant un montage de 600 frames ; comme il dure un nombre entier de
mesures, chaque coupe existante est retombée sur la même phase musicale. Toute
insertion future doit respecter ça.

---

## 1b. Les accroches

`src/reel/hooks/` — un registre, trois ouvertures. Le reste du film ne sait
pas laquelle joue.

Six plans sur sept sont fixes : ils disent ce que vend la boutique et comment
on y commande, et ça ne dépend pas de la façon dont le film ouvre. **Seules
les deux premières secondes décident si le pouce s'arrête**, et ce sont elles
qu'on teste. Une accroche, c'est donc trois choses : un plan de 60 frames, une
voix off, un lit musical.

| Clé | Plan | Ce qu'on voit | Voix | Lit | Composition |
|---|---|---|---|---|---|
| `lion` | `hooks/Lion.tsx` | Le lion seul, « TON MAILLOT / Livré à Dakar. Payé à la livraison. » | `vo-lion` | `reel-music` | `Reel`, `ReelAd` |
| `price` | `hooks/Shock.tsx` | Le maillot du Barça claque, **7 500 F** par-dessus, puis le nom du club, puis « Livré chez toi. » | `vo-price` | `reel-music-shock` | `ReelPrice`, `ReelPriceAd` |
| `market` | `hooks/Shock.tsx` | **15 000 F** seul, barré net, puis le maillot et **7 500 F** à la place | `vo-market` | `reel-music-shock` | `ReelMarket`, `ReelMarketAd` |

### Les deux règles

1. **60 frames, ou un multiple entier de 60.** Une mesure à 120 BPM. Une
   accroche de 45 ou de 90 frames décale chaque coupe suivante sur un temps
   faible et décolle tout le montage du son.
2. **Le texte à l'écran est le début de la voix off, mot pour mot.** Un texte
   qui dit autre chose que ce qu'on entend force à lire et à écouter deux
   choses à la fois, et on ne retient ni l'une ni l'autre.

### Ce que `price` et `market` corrigent

L'accroche au lion **fait attendre le produit de deux secondes**. Un lion
dessiné est sympathique, il n'est pas une raison d'acheter : personne ne
connaît DakarKits, personne n'attend sa mascotte. Les deux accroches du choc
ouvrent sur un maillot et un montant, et laissent le lion signer à la fin — où
il a enfin quelque chose à signer.

Le maillot des deux est `HERO` (`timeline.ts`), c'est-à-dire **le dernier de la
parade**, pris par la fin de la liste et non par une constante : si l'ordre de
la parade change, l'accroche suit, et le raccord « barca » du plan de recherche
reste celui du maillot qu'on vient de montrer.

### Le prix passe par-dessus le maillot — ici, et nulle part ailleurs

`Lit.tsx` dit l'inverse : rien ne passe sur un maillot, le texte se range dans
les bandes libres. Cette règle vaut pour la parade, où le sujet **est** le
produit. Dans les deux accroches du choc le sujet est le **montant** ; le
maillot dit seulement de quoi on parle. Un voile monte du bas du cadre pour
donner un sol au nombre, et c'est le seul endroit du film où une photo de
maillot est assombrie.

### ⚠️ La frame 0 est maintenant un maillot de club, en gros plan

Les deux accroches du choc mettent **l'écusson du Barça, le swoosh et le
sponsor maillot plein cadre dès la première image**. Ce n'est pas une
nouveauté du film — la parade les montre déjà à la deuxième seconde, et ce
sont nos propres photos de notre propre stock, donc la règle §10.1 (jamais une
photo produit officielle) est respectée.

Ce qui change, c'est **où** ils sont. La première image d'une annonce est
celle que la revue automatique de Meta et de TikTok regarde en premier, et la
détection de visuels de marque est la première cause de bannissement d'une
boutique de vêtements (`../AGENTS.md`). Si un compte publicitaire est refusé
après la mise en ligne de `price` ou de `market`, **c'est la première chose à
tester** : la même accroche montée sur le maillot du Sénégal — pas de sponsor,
pas de club européen — dit la même phrase pour le même prix, à « Le maillot du
Barça » près.

### ⚠️ Les 15 000 F de `market` ne viennent d'aucune capture

Tous les montants du film sont relevés sur le site (règle §10.7). **Celui-là
non** : c'est une affirmation du brief sur ce que les gens paient au marché, et
elle n'est sourcée nulle part. Trois précautions dans le plan, à garder si la
variante est reprise :

- il est écrit comme une phrase à la deuxième personne — « arrête de payer » —
  jamais comme un tarif attribué à un concurrent nommé ;
- il n'est **jamais barré à côté du nôtre** comme le serait un ancien prix
  DakarKits. Le vrai ancien prix du Barça est 10 000 F, et c'est celui que la
  parade affiche barré. Le 15 000 vit dans son propre temps, avant que le
  maillot arrive ;
- il ne réapparaît nulle part ailleurs dans le film.

### Ajouter une accroche

1. Un composant dans `src/reel/hooks/`, **60 frames**.
2. Une voix off : `text_to_speech` (voir §2), le `.mp3` dans
   `public/audio/vo-<clé>.mp3`, puis `npm run vo`.
3. Une entrée dans `HOOKS` (`hooks/index.ts`).
4. Deux lignes dans `REEL_HOOKS` (`src/Root.tsx`) — organique et publicité.
   Le fichier **jette une erreur au démarrage** si une accroche déclarée n'a
   pas de composition : une accroche oubliée là ne serait jamais rendue, et
   rien ne le dirait.
5. Deux scripts de rendu dans `package.json`.

---

## 2. Les voix off

### ⚠️ Statut : **piste de travail, pas bonne à diffuser**

**Une voix par accroche**, et la même `voice_id` pour les trois.

| | |
|---|---|
| **Fournisseur** | Fish Audio (serveur MCP) |
| **`voice_id`** | `fb1bf759f90f49e5a1e23488e78138f4` |
| **Titre** | « voix africaine jeune » |
| **Compte ayant déposé la voix** | « Yannick Kouadio » (`38a58aebf7d84006832643cb515177ce`) |
| **Langue** | `fr` |

| Fichier | Accroche | Durée | Frames | Coût | `task_id` |
|---|---|---|---|---|---|
| `vo-lion.mp3` | `lion` | 12,23 s | 367 | 270 | `b087576cc5ad49b288c55b4bfe205a4e` |
| `vo-price.mp3` | `price` | 14,27 s | 428 | 293 | `1d127ef494314328bb7457c312aaa7e7` |
| `vo-market.mp3` | `market` | 12,40 s | 372 | 273 | `54e115ff71ee4974831c56b7b122cbee` |

**Les textes envoyés, mot pour mot** (les crochets sont des balises de jeu,
elles ne sont pas prononcées) :

```
lion    [energetic] Eh, toi ! Tu cherches ton maillot ? [pause] Tape le nom de
        ton équipe, choisis ta taille, et c'est tout. Trois champs, pas de
        compte à créer. [confident] Je te livre à Dakar en 24 heures,
        gratuitement. Et tu paies seulement quand tu l'as entre les mains.

price   [excited] Sept mille cinq cents francs. Le maillot du Barça. Livré
        chez toi. [confident] Tape le nom de ton équipe, choisis ta taille, et
        c'est tout. Trois champs, pas de compte à créer. Je te livre à Dakar
        en 24 heures, gratuitement. Et tu paies seulement quand tu l'as entre
        les mains.

market  [energetic] Arrête de payer ton maillot quinze mille francs. [pause]
        Ici c'est sept mille cinq cents, livré chez toi. Tape le nom de ton
        équipe, choisis ta taille. Trois champs, pas de compte. Je te livre à
        Dakar en 24 heures, gratuitement, et tu paies à la livraison.
```

Les montants sont **écrits en lettres**, jamais en chiffres : « 7 500 F »
envoyé tel quel se fait lire de façons imprévisibles par le modèle, et une
publicité qui annonce mal son prix ne sert à rien.

Le premier est le script « A — Le lion te parle », choisi parmi trois
propositions. Les deux autres n'en changent que l'ouverture, pour qu'elle
corresponde à ce qui est écrit à l'écran. Aucun ne dit que ce que le site dit
vraiment, et jamais « officiel » ni « authentique ».

### ⚠️ Le choix de garder cette voix sur les nouvelles vidéos a été fait en connaissance de cause

Le 2026-10-13, la question a été reposée avant de générer `vo-price` et
`vo-market` : le §ci-dessous dit que cette voix n'est pas bonne à diffuser, et
la réutiliser sur deux films de plus étend le problème. Les trois options
proposées étaient : aucune voix sur les nouvelles vidéos, la voix par défaut
de Fish, ou un clonage gratuit d'une voix qu'on possède (§7).

**Décision du client : réutiliser la même voix**, pour que les trois films
sonnent pareil. Le risque décrit ci-dessous est donc accepté, pas résolu — et
§7 reste la priorité.

### Pourquoi ce n'est pas bon à diffuser

**Attention à la formulation : rien ne prouve que cette voix soit volée.** Ce
qui est établi, c'est qu'on ne peut pas documenter d'où elle vient. Les deux
choses sont différentes et la nuance compte.

**Ce qui est vérifié** (API Fish Audio + page publique
`fish.audio/m/fb1bf759f90f49e5a1e23488e78138f4`) :

1. C'est un **« Clone Model »** : la voix d'un être humain réel, pas une voix
   synthétique construite de zéro.
2. **Aucune information de source, de consentement ou de licence** n'est
   attachée, ni dans l'API ni sur la page publique.
3. **La fiche se contredit** : la description dit « A middle-aged **female**
   voice… **She** speaks… », les étiquettes disent **male**. Généré
   automatiquement, jamais relu.
4. Fish Audio **ne vérifie rien** : son outil de clonage demande au déposant
   de cocher `confirm_voice_rights` et se réserve le droit de retirer les voix
   en infraction. La plateforme délègue et garde un droit de retrait.

**Ce qui n'est qu'une déduction** : le texte de démonstration ressemble à la
parole d'un vrai créateur répondant à une critique — « Vous venez critiquer
**mes vidéos** », « **ma communauté** ». Si ce texte est la transcription de
l'audio d'entraînement, alors cet audio vient d'un créateur de contenu. **Mais
le déposant peut très bien être ce créateur en train de cloner sa propre
voix**, ce qui serait parfaitement légitime. Rien dans les outils disponibles
ne permet de trancher.

**La vraie raison de ne pas diffuser, et elle tient dans les deux cas :**

- **Provenance indocumentable.** Si quelqu'un demande « c'est la voix de
  qui ? », il n'y a pas de réponse. Pour de la publicité payante, c'est le
  problème en soi — pas besoin qu'il y ait faute.
- **Plan gratuit.** Le compte est en `plan: "free"`. Plusieurs sources tierces
  affirment que le palier gratuit de Fish Audio est réservé à un usage
  **personnel et non commercial**. *Non vérifié sur les CGU officielles*
  (pages inaccessibles au moment d'écrire) — **à confirmer dans le compte**,
  c'est l'affaire de deux minutes et c'est peut-être la contrainte qui
  tranche, quelle que soit l'origine de la voix.
- **Continuité** — et c'est l'argument le plus solide, parce qu'il tient même
  si la voix est parfaitement légitime. Une voix publique déposée par un tiers
  peut être supprimée par son déposant ou retirée par la plateforme à tout
  moment. Si ça arrive après trois films, le quatrième ne peut plus y
  correspondre. Une mascotte qui change de voix à chaque vidéo n'est pas une
  mascotte.

**Une vérification gratuite que le code ne peut pas faire** : faire écouter
l'échantillon à quelqu'un à Dakar ou à Abidjan. Si une personne du public visé
reconnaît la voix, la question est réglée.

**→ À remplacer par une voix dont on a les droits** (voir §7). Le jour où
elle existe, les trois scripts ci-dessus sont à renvoyer tels quels, et
`npm run vo` refait les trois enveloppes d'un coup.

L'argument de **continuité** ci-dessus s'est alourdi le 2026-10-13 : ce ne
sont plus un film mais **trois** qui dépendent d'une voix que son déposant
peut retirer du jour au lendemain.

### Comment elle est posée dans le film

- `VO_AT = 8` (`src/reel/timeline.ts`) : elle démarre à la frame 8, le temps
  que le lion soit entré dans le cadre. Un personnage qui parle avant d'être
  installé donne l'impression que le son est en avance. Les accroches du choc
  gardent la même frame : le maillot a claqué, le montant est posé.
- Elle s'arrête entre la frame 375 et la frame 436 selon la version, toujours
  **pendant le plan du formulaire**. La fin du film se joue sans parole.
- Le lit musical se creuse dessous : `MIX.music` 0,84 → `MIX.musicDucked` 0,52,
  descente en 10 frames, remontée en 20 (`src/reel/ReelAudio.tsx`). **Le creux
  est calculé sur la durée de la voix du film qu'on rend**, jamais sur une
  constante : les trois ne font pas la même longueur, et avec un nombre figé la
  plus longue garderait sa musique à plein volume sous ses deux dernières
  secondes de parole.

### Les enveloppes

`npm run vo` → `scripts/make-vo-envelope.mjs` → `src/reel/vo-envelope.ts`.

Le script **balaie `public/audio/vo-*.mp3`** et sort un objet `VO` indexé par
accroche : fichier, durée en frames, et une valeur de niveau **par frame**,
calculée à froid avec le ffmpeg de Remotion. Le rendu ne lit qu'un tableau de
nombres : analyser de l'audio pendant le rendu rendrait le film non
déterministe (deux rendus, deux animations).

L'enveloppe est **passée au lion en `prop`**, jamais importée par lui : avec
un `import`, il resterait figé sur celle du premier montage et accentuerait
sur les syllabes d'une phrase qu'on n'entend plus. Dans la pratique seul
`hooks/Lion.tsx` s'en sert — c'est le seul plan où il parle à l'écran.

**Si une voix change, relancer `npm run vo`.**

---

## 3. La mascotte

### ⚠️ Ne jamais utiliser `../assets/masquotte.webp` ni `../assets/masquotte2.webp`

Ces deux photos montrent la **mascotte officielle des Jeux Olympiques de la
Jeunesse Dakar 2026**, photographiée à sa cérémonie de lancement. Elles sont
dans le dépôt comme point de départ d'une demande, pas comme asset. Trois
raisons de ne pas s'en servir, dans l'ordre de gravité :

1. **Le compte publicitaire.** Les marques olympiques sont parmi les plus
   surveillées au monde et leur détection est automatique. C'est la façon la
   plus rapide de perdre le compte Meta dont dépend tout le trafic.
2. **Ce sont les marques d'un tiers** — anneaux, millésime, nom de
   l'événement. Les reprendre laisse entendre un lien qui n'existe pas, ce que
   la règle « jamais officiel ni authentique » existe précisément pour
   empêcher.
3. Les deux photos montrent des **personnes réelles identifiables**, dont un
   chef d'État.

### Le lion, lui, est à nous

Généré pour la boutique. Un lion — symbole du pays et de son équipe, qui
n'appartient à personne — en maillot uni violet : **sans écusson, sans
anneaux, sans millésime, sans aucun texte**.

| | |
|---|---|
| **Modèle** | `gpt-image-2` (Fish Audio MCP), 1K, qualité `medium`, ratio 2:3 |
| **Variantes de base** | 2, génération `2221a7c9d6ca4642ad1f8357bd0b0432`, 1 300 crédits |
| **Variante retenue** | B — `cec233eb566cfa00960352f68603e7a0` → `assets/mascot/lion-b.png` |
| **État bouche ouverte** | génération `24e1f596a64244c7976945b5db90eb43`, 1 260 crédits → `assets/mascot/lion-open.png` |
| **Image réellement utilisée** | **`lion-open.png`** (il parle à l'écran) |
| **Détourage** | `npm run mascot` → `public/mascot/lion.webp`, 667 × 1072 |

**Le prompt de base, mot pour mot** — à réutiliser tel quel pour garder le même
personnage :

```
Original mascot character for a Senegalese online football-jersey shop. A
friendly, confident young male lion with a warm golden-brown coat and a neat
dark-amber mane, big expressive eyes, upright rounded ears. He wears a plain
modern football jersey in deep violet with subtle darker violet side panels
and a simple crew collar — the jersey carries NO logo, NO crest, NO text, NO
numbers and no sponsor of any kind. Clean stylised 3D cartoon render, soft
studio lighting, smooth matte surfaces, gentle violet rim light.
Three-quarter front view from the waist up, facing the viewer, mouth closed in
a warm closed-lip smile, one hand relaxed at his side. Centred, the whole head
and both shoulders well inside the frame with generous margin. Flat uniform
pure magenta background, completely plain, no gradient, no cast shadow on the
background, no props, and no text anywhere in the image.
```

Le fond magenta n'est pas décoratif : c'est une couleur **absente du
personnage** (doré, brun, violet), donc le détourage se fait à la distance
colorimétrique sans masque dessiné à la main. L'aplat relevé est `#d5037c`.
Si un futur rendu change de fond, mettre à jour `KEY` dans
`scripts/make-mascot.mjs`.

### Où il apparaît, et pourquoi pas ailleurs

- **`hook`** (0–60) : seul, grand, coupé à la taille par le bas du cadre —
  **uniquement sur l'accroche `lion`**. Les deux accroches du choc n'ont pas
  de lion du tout.
- **`endcard`** (540–660) : petit, en bas à droite, coupé par le bord, sous la
  couche du lockup. **Dans les six versions** : c'est la signature de la
  marque, et elle ne dépend pas de l'ouverture.

**Il n'est pas dans les plans de commande**, et ce n'est pas un oubli. En 9:16
il n'y a pas de place : la fenêtre du téléphone occupe 270→1274, le libellé
1300→1470, et les 350 px du bas (`SAFE.bottom`) sont mangés par l'interface de
TikTok — barre de légende en bas à gauche, rail d'actions à droite. Le modèle
de référence fourni par le client place son personnage à côté de l'interface,
mais il est en 16:9, où il reste de la largeur.

**Il n'est pas non plus dans la parade** : règle du film, rien d'autre que des
maillots pendant cinq secondes.

### La bouche ne s'articule pas — trois pistes mortes

Le lion est généré **bouche ouverte**. Trois façons de l'animer ont été
essayées et jetées ; elles sont documentées en détail dans
`src/reel/Mascot.tsx`. En résumé :

1. **Deux états + fondu** — le modèle a redessiné la tête (plus petite, plus
   haute, crinière et yeux différents). Le fondu montrait une tête qui change,
   pas une bouche qui se ferme.
2. **Le menton qui remonte** (décalage vertical dans une fenêtre ovale) — le
   menton a sa forme propre : remonté, il posait deux bosses de poil clair au
   milieu de la bouche.
3. **La mâchoire haute qui descend** (écrasement vertical) — la cavité est plus
   grande que toute fenêtre tenant à l'intérieur du museau, donc il restait un
   croissant sombre **en dehors** de la fenêtre. Contour doublé. Élargir la
   fenêtre la faisait mordre sur le contour de la joue, qui se doublait à son
   tour.

**Ce qui porte la parole à la place** : le corps se redresse sur les syllabes
fortes (`push`), la tête suit avec **deux frames de retard** (`nod`) — c'est ce
décalage qui fait une nuque plutôt qu'un bloc rigide — et le tout respire.

Une vraie articulation demande un rendu de synchronisation labiale : **~1 940
crédits la seconde**, soit ~3 900 pour les deux secondes du `hook`. Modèles
disponibles : `creatify/aurora/avatar`, `heygen/avatar4/avatar`,
`veed/fabric-1.0/avatar`, `infinitalk/avatar`. Réserve : ils sont réglés pour
des visages humains, un lion stylisé peut revenir déformé — et les crédits
sont dépensés dans tous les cas.

### Le traitement visuel

Sorti du modèle, c'est un rendu 3D brillant et saturé en lumière de studio
neutre : posé tel quel il se lit comme une image collée. Trois couches le
ramènent dans la palette, **toutes au rendu, aucune retouche de la source** :
un halo découpé à sa silhouette, un voile de la couleur primaire en
`soft-light` qui tire les ombres vers le violet du thème, et une ombre de
contact au sol. Le grain du film passe par-dessus et unifie le tout.

---

## 4. Les captures du site

Tout ce qui montre l'interface est une **capture de louyomb.com**, jamais une
interface redessinée.

```bash
npm run capture        # relève le site + la géométrie
npm run assets         # assets/shots/*.png -> public/shots/*.webp
```

Dernière capture : **2026-10-13**, 68 vues.

Deux cadrages, **jamais mélangés** :

| | Bureau | Téléphone |
|---|---|---|
| Viewport | 1920 × 1080 @2x | **430 × 932 @3x** |
| Préfixe | `d-`, `f-`, `p-` | `m-` |
| Géométrie | `SHOT` / `G` | `SHOT_M` / `GM` |
| Utilisé par | le spot 16:9 | **les plans de commande du reel** |

`src/spot/geometry.ts` est **généré** — ne pas l'éditer à la main.

### Pourquoi le téléphone

Les plans de commande étaient montés sur les captures de bureau. Une page de
1 920 px ramenée dans une fenêtre de 984 sort à 0,83× : les libellés du
formulaire tombaient à **douze pixels** de haut à l'écran. La capture
téléphone fait 430 px de large, donc **2,09×** dans la même fenêtre — deux
fois et demie plus grand. Et c'est la mise en page que le client voit
vraiment.

Gain secondaire, plus important encore : les captures téléphone sont des
**vues de fenêtre** prises après défilement, et `GM` est mesuré dans ce même
défilement. Les coordonnées tombent **au pixel** sur les images, sans le pont
`scrollY` que la version bureau devait faire à la main.

### Deux captures à connaître

- **`m-form-bottom`** — le tunnel de commande **descendu en bas de page**. Le
  bouton « Confirmer ma commande » est collé en bas de l'écran : en haut de
  page il recouvre le champ « Adresse de livraison » et n'en laisse voir
  qu'une trentaine de pixels. Descendu, les trois champs se dégagent
  entièrement **et** le récapitulatif reste visible, total compris.
- **`m-added`** — identique à `m-product-picked` au pixel près sauf la
  pastille du panier. La bascule entre les deux ne se voit pas, seule la
  pastille apparaît.

Le panier mobile ne contient **qu'un maillot** (7 500 F), ce qui correspond à
ce que le film met au panier — d'où le fait que le montant est enfin montré.
La capture bureau en contenait deux (17 500 F), et le plan devait cadrer sous
le récapitulatif pour ne pas afficher un total incohérent.

---

## 4b. La parade — le raccord entre deux maillots

`src/reel/scenes/Parade.tsx`. Trois maillots en cinq secondes, un par mesure
et demie.

### ⚠️ Le trou noir de la quatrième seconde — corrigé le 2026-10-13

Le premier montage faisait **sortir** un maillot sur les onze frames *avant*
l'entrée du suivant, et le suivant ne commençait son entrée qu'après.
Résultat, mesuré sur le rendu : vers les frames 147–152, le Maroc avait
disparu et le Barça n'était pas encore là. **Une demi-seconde de cadre
presque noir, à la quatrième seconde d'une publicité de vingt-deux.** C'est
exactement là que le pouce part.

Le raccord est maintenant un vrai fouetté, et il tient à trois choses :

1. **La sortie court sur `[end, end + WHIP]`**, donc *pendant* l'entrée du
   suivant. Les deux maillots sont à l'écran en même temps.
2. **Le sortant part dans la direction où voyage l'entrant** — `-dir` du
   *suivant*, pas le sien. Sinon ils se croisent en sens inverse et se
   percutent au milieu.
3. **Les deux partagent la même courbe (`EASE.out`).** C'est le point le moins
   évident : la sortie avait d'abord été écrite en `EASE.in`, parce que « ce
   qui sort accélère » est la règle du projet. Mais l'entrée est en
   `EASE.out` : à la cinquième frame du croisement, le Barça était arrivé à
   90 % et le Maroc n'avait bougé que de cent pixels. On ne voyait pas deux
   maillots se croiser, on voyait le second **tomber sur** le premier, badge
   de remise compris. Avec la même courbe des deux côtés, ils restent à
   1 250 px l'un de l'autre d'un bout à l'autre : c'est une bande de deux
   maillots que la caméra balaie, et c'est ce qu'un fouetté est.

### Deux passes, pas une par maillot

`Parade` monte **tous les fonds, puis tous les maillots**. Avec un fond par
maillot rendu juste au-dessus du sien, le fond opaque de l'entrant passerait
par-dessus le maillot du sortant et le couperait net au milieu du croisement.
Et un fond qui partirait avec son maillot rouvrirait le trou noir qu'on vient
de boucher.

Le texte, lui, s'efface **avant** le fouetté (`[end - 4, end + 3]`) : pendant
le croisement, deux noms d'équipe et deux prix vivent dans les mêmes bandes,
et quatre lignes superposées ne se lisent pas.

**La frame 150 est sur la planche-contact pour ça, et pour rien d'autre.**

---

## 5. Le cadrage des plans de commande

Dans `src/reel/Stage.tsx` et `src/reel/scenes/Order.tsx`.

- `WIN_PHONE = { x: 90, y: 270, w: 900, h: 1004 }` — la fenêtre, centrée avec
  le libellé dans la bande sûre (250 → 1570).
- `framePhone(cx, cy)` sans largeur — l'écran entier, 430 px. **2,09×,
  480 px de page visibles.** C'est le cadrage d'établissement.
- `framePhone(cx, cy, w)` — le cadrage serré. `track(frame, looks[])` interpole
  les trois valeurs **séparément** entre des points de passage, ce qui permet
  de descendre d'un champ au suivant sans rouvrir le cadre, puis de rouvrir
  sans bouger le regard.

### La largeur est redevenue un paramètre — le 2026-10-13, et sous conditions

Elle ne l'était pas, et la règle disait : *« une capture d'écran de téléphone
se montre en entier dans sa largeur, ou pas du tout »*. Elle venait d'un vrai
accident — un premier montage serrait à 338 px et sortait « 7 50 » au bord du
cadre.

Mais à 430 px de large, **un libellé de 16 px sort à 33 px sur une image de
1 920** : sur un téléphone tenu en main, une douzaine de pixels réels. Le plan
qui porte toute la promesse — « trois champs, pas de compte » — restait celui
qu'on ne pouvait pas lire. La règle protégeait le cadrage et perdait le texte.

Ce qui la remplace n'est pas « serrer librement », c'est : **serrer sur ce que
le plan montre, et seulement quand ce qui compte y tient.** La différence est
déjà dans la page.

| Ce qu'on serre | Pourquoi c'est possible |
|---|---|
| Les **champs du formulaire** | Tout est calé à gauche : libellé à x = 16, saisie à x = 28, moitié droite vide. Une fenêtre de 300 px partant de x = 10 les porte en entier, à **3,0× — 43 % de plus**. |
| Le **champ de recherche** pendant la frappe | Même raison : loupe à 28, saisie à 55. 300 px, le temps que « barca » s'écrive. |

| Ce qu'on ne serre pas | Pourquoi |
|---|---|
| La **liste de résultats** | Le prix est calé à droite, à x = 413. C'est l'accident d'origine. Le plan `Search` **rouvre à 430 px avant que la liste tombe**. |
| Le **sélecteur de taille** | Les cinq tailles vont de x = 16 à x = 414 sur une page de 430 : le groupe occupe la largeur entière à seize pixels près. Il n'y avait que 8 % à gagner et une marge nulle à y perdre. Ce plan se lit par son libellé, pas par le zoom. |
| Le **bouton du panier**, le **bouton « Confirmer »** | Le premier est dans le coin bas-droit, le second colle le bas de l'écran sur toute la largeur. |

**Le bord gauche tombe à x = 10, jamais à x = 16.** Six pixels de marge avant
la boîte du champ : à 3,0×, quatre pixels de trop mangent la moitié d'une
lettre, et c'est exactement ce qu'a donné le premier essai à `cx = 170` —
« éléphone », « dresse de livraison », « om complet ».

### Les trajets, plan par plan

Frames **locales** au plan (`Sequence`), pas globales.

| Plan | Trajet | Pourquoi |
|---|---|---|
| `Search` | 430 px @ cy 268 → **300 px @ cx 160, cy 176** (f. 15–22) → 430 px @ cy 240 (f. 30) | on serre pour taper, on rouvre pour lire le résultat et son prix |
| `Pick` | 430 px @ cy 384 → cy 466 (f. 16) → **cy 690** (f. 32) | pleine largeur tout du long ; la descente amène la barre collée en bas |
| `Fill` | 430 px @ cy 422 → **300 px** sur le nom (cy 404), le téléphone (cy 490), l'adresse (cy 609) → 430 px @ cy 690 (f. 94) | la caméra suit le champ qui se remplit, puis rouvre sur le bouton |

### ⚠️ Le tap « Ajouter au panier » se jouait hors champ

Corrigé en même temps. `Pick` tenait un cadrage fixe sur 144 → 632 et le
bouton du panier est à **868** : le doigt partait le chercher sous le bord de
la fenêtre, le `Focus` posé dessus n'était pas visible non plus, et on voyait
la pastille passer à 1 sans avoir vu ce qui l'y avait mise. Deux secondes de
plan pour un geste qu'on ne voit pas. La caméra descend maintenant avec le
doigt et le bouton entre dans le cadre une douzaine de frames avant d'être
pressé.

Le curseur est en mode **`touch`** (`<Cursor touch />`) : une pastille de
doigt, pas une flèche de souris. Une flèche sur un écran tactile est le genre
de détail qui décrédibilise sans qu'on sache pourquoi. Il vit dans l'espace de
la page et **se contre-échelonne sur le zoom** (`useFrameScale`) : à 3,0× il
garde la taille d'une vraie pulpe au lieu de devenir un ballon.

---

## 6. La musique et le son

`npm run audio` → `scripts/make-reel-audio.mjs` → **deux** fichiers :

| Fichier | Accroches | Couleur |
|---|---|---|
| `reel-music.wav` | `lion` | Am7 / Fmaj7, résolution Cmaj7. Groove dès le premier échantillon. |
| `reel-music-shock.wav` | `price`, `market` | Dm7 / Bb maj7, résolution Fmaj7. **Un coup, un creux, puis le groove.** |

Ce qui les sépare tient dans l'objet `VARIANTS` en tête du script : les deux
accords, l'accordage du log drum, une graine, et un drapeau `strike`.

**Pourquoi deux lits.** Une accroche n'a pas seulement une image, elle a une
attaque. Le lion *s'installe* — il entre, il parle, la musique tourne déjà
sous lui. Le choc du prix *frappe* — un maillot claque et un montant tombe, et
un lit qui ronronne dessous rend le coup moins fort qu'il n'est. Garder les
mêmes accords aurait en plus donné la même couleur aux deux, et deux versions
d'une publicité qui sonnent pareil se testent mal : on ne sait plus ce qu'on
compare.

Sur le lit du choc, la **première mesure est presque vide** — le sub le plus
grave et le plus long du film sur la frame 0, une montée filtrée derrière, la
nappe à demi-voix, et rien d'autre. Batterie, sabar et shaker n'entrent qu'à
la deuxième mesure, c'est-à-dire sur le premier maillot de la parade. C'est ce
creux qui fait exister le coup. Sans la montée, les deux secondes entre le
coup et la parade seraient du silence pur, et un silence de deux secondes au
début d'un reel se lit comme un fichier cassé.

**Ce qui ne change jamais d'un lit à l'autre** : le tempo, la durée, les
bornes de section et les coupes. Elles sont l'image de `timeline.ts`.

Synthétisée en code, 120 BPM, **22 s**. Les constantes de section sont en
secondes et ont toutes reculé de 2 s le jour où le `hook` a été ajouté :

```js
const DURATION = 22
const T = { parade: 0, order: 7, done: 15, sign: 18 }
const CUTS = [2, 7, 9, 11, 15, 18]
const JERSEYS_AT = [2, 3.5, 5.0]
```

`T.parade` couvre aussi le `hook` : sur `reel-music` les deux partagent la
même texture. Sur `reel-music-shock`, c’est justement là que le drapeau
`strike` vide la première mesure — la section ne change pas, son contenu si.

Tous les bruitages de `src/reel/ReelAudio.tsx` dérivent de `BEATS` — déplacer
une borne les déplace automatiquement. Seuls les fichiers musicaux doivent
être régénérés à la main.

---

## 7. Ce qu'il reste à faire

### Priorité : remplacer la voix

`create_voice_clone` (Fish Audio) est **gratuit** et demande 10 à 60 secondes
de parole propre d'**un seul** locuteur. Enregistrer l'exploitant, ou payer un
comédien dakarois. On obtient alors une voix consentie, constante d'une vidéo
à l'autre, et qui nous appartient.

**Trois films en dépendent maintenant, pas un.** Les trois scripts de §2 sont
prêts à être renvoyés tels quels ; `npm run vo` refait les trois enveloppes
d'un coup, et aucun plan n'est à retoucher.

### Le wolof

Fish Audio n'a que **deux** voix en `wo`, toutes deux inutilisables :

- `f749db7984544eec87e58485ece8803b` « Wally seck chanteur » — **chanteur
  sénégalais célèbre**, personnalité publique nommée, 0 génération. Non.
- `8831807dc59645f48117e086d6a9f2c4` « Pape gueye » — étiquetée « neutral
  senegalese, advertisement », donc le bon registre, mais nommée d'après une
  personne réelle et utilisée **6 fois en tout**. Non testée.

Doute supplémentaire : une voix *étiquetée* `wo` ne prouve pas que le modèle
ait été entraîné sur du wolof — ce peut être un modèle français lisant du
wolof phonétiquement, ce qu'un locuteur natif entendra immédiatement.

**La réponse propre est la même que ci-dessus** : cloner une voix qu'on
possède. Si l'enregistrement est en wolof, la voix parle wolof avec un vrai
accent sénégalais, ce qu'aucune voix de catalogue ne donnera.

### Pistes esthétiques (vidéo de référence du client)

Le client a fourni `../assets/achxvi_video_1.mp4` (publicité « Pocketsflow »,
15 s, 16:9) comme référence de style. Ce qui en a été repris : le personnage
**intégré** à la palette plutôt que posé dessus, et **cadré par le bord** à
côté du lockup. Ce qui ne l'a pas été, et pourquoi :

- **Traitement tramé / monochrome** du personnage. Faisable et gratuit, mais
  c'est une décision de marque — on perdrait le maillot violet et les couleurs
  chaudes du lion.
- **Typographie éditoriale** (sans + serif italique en accent). Demande une
  troisième police ; `AGENTS.md` fixe deux polices et le jeton
  `--font-display`.
- **Aplats de couleur** alternés blanc / bleu électrique / noir. Cosmic Night
  est sombre uniquement et les couleurs en dur sont interdites hors de trois
  fichiers.

### Les autres films sont en retard

`out/videos/dakarkits-spot-*.mp4` datent des 10–11 octobre : ils utilisent
encore les captures **bureau** pour la commande et n'ont ni le lion ni le
« +32 ». Si le spot 16:9 doit resservir, il faut décider s'il reprend le
téléphone.

---

## 8. Crédits Fish Audio

| Poste | Crédits |
|---|---|
| 2 variantes du lion | 1 300 |
| État bouche ouverte | 1 260 |
| Voix off `lion` | 270 |
| Voix off `price` | 293 |
| Voix off `market` | 273 |
| **Total dépensé** | **3 396** |
| **Solde au 2026-10-13 (soir)** | **6 604** (+ 2 000 extra) |

Formule TTS : **1 crédit par octet UTF-8** du texte. Plan gratuit : **500
octets maximum par appel** — un script français d'une cinquantaine de mots
tient tout juste, les accents comptent double.

---

## 9. Les commandes

```bash
npm run dev            # Remotion Studio
npm run capture        # relève louyomb.com (desktop + téléphone) et la géométrie
npm run assets         # PNG -> WebP + src/spot/assets.ts
npm run mascot         # détoure le lion -> public/mascot/lion.webp
npm run vo             # enveloppes des voix -> src/reel/vo-envelope.ts
npm run audio          # régénère les musiques (dont les deux lits du reel)
npm run sheet Reel     # planche-contact, une image par plan
npm run sheet ReelPrice    # les 3 temps de l'accroche « prix »
npm run sheet ReelMarket   # les 3 temps de l'accroche « marché »

npm run render:reel          # accroche lion,   organique
npm run render:reel-ad       # accroche lion,   publicité
npm run render:reel-prix     # accroche prix,   organique
npm run render:reel-prix-ad  # accroche prix,   publicité
npm run render:reel-marche   # accroche marché, organique
npm run render:reel-marche-ad
npm run render:reels         # les quatre nouvelles d'affilée
```

### Fichiers générés — ne pas éditer à la main

`src/spot/geometry.ts` · `src/spot/assets.ts` · `src/reel/vo-envelope.ts` ·
`src/reel/mascot-asset.ts` · `public/shots/*` · `public/mascot/*` ·
`public/audio/*.wav`

### Piège Windows

Certaines machines refusent `CREATE_ALWAYS` sur un fichier déjà suivi par git
et renvoient un `UNKNOWN (-4094)` que rien n'explique. `capture.mjs` et
`make-vo-envelope.mjs` écrivent donc leurs fichiers générés en `r+` + troncature
(`writeGenerated`). C'étaient les **dernières** écritures du script : quand
elles échouaient, les captures étaient sur le disque mais la géométrie
n'existait qu'en mémoire — trois minutes de parcours perdues pour un drapeau
d'ouverture.

---

## 10. Les règles à ne pas enfreindre

1. **Jamais la mascotte olympique** (`../assets/masquotte*.webp`), ni aucune
   photo produit officielle, ni aucune image générée par IA pour illustrer un
   maillot. Les photos de maillots sont les nôtres.
2. **Jamais « officiel » ni « authentique »** pour décrire un maillot.
3. **Jamais de voix clonée d'une personnalité publique identifiable.** Le
   catalogue Fish Audio en contient beaucoup — Mbappé, Macron, Wally Seck,
   Trump. Nommées, vérifiables, jamais consentantes. Pour une publicité
   commerciale, non.

   **Ne pas confondre avec le cas de §2.** La voix off actuelle n'est pas
   nommée d'après quelqu'un et ne tombe donc **pas** sous cette règle-ci : son
   problème est de provenance indocumentable, pas d'usurpation. Deux risques
   distincts, deux réponses différentes — le premier est une interdiction
   nette, le second un jugement à porter selon l'usage (organique ou payant).

   La règle générale qui couvre les deux : **une voix utilisée en publicité
   doit être une voix dont on peut prouver qu'on a le droit de s'en servir.**
4. **L'interface n'est jamais redessinée** — toujours une capture du site.
5. **La marque n'apparaît en grand qu'au carton de fin.** Le mot-symbole se
   voit avant, à l'intérieur des captures : sur téléphone la barre de
   recherche est sous l'en-tête et on ne peut pas cadrer l'une sans l'autre.
6. **Le « + » de « +32 maillots » fait du nombre un plancher.** Le catalogue
   grossit, le film ne bouge pas : « 32 » devient faux dès le 33ᵉ publié,
   « +32 » reste vrai. Le nombre lui-même est relevé à la capture
   (`G.home.countText`), jamais écrit en dur.
7. **Les montants affichés sont ceux des captures.** Le film ne recalcule
   rien, il lirait faux. **Une seule exception**, et elle est documentée :
   les 15 000 F de l'accroche `market` (§1b), qui sont une affirmation du
   brief sur ce que les gens paient au marché. Les précautions qui
   l'accompagnent sont à garder si la variante est reprise.
8. **Une accroche fait 60 frames, ou un multiple entier de 60.** Tout le
   montage est calé sur la mesure à 120 BPM ; une accroche d'une autre durée
   décale chaque coupe suivante sur un temps faible (§1b).
9. **Un serrage sur une capture n'est permis que si ce qui compte y tient en
   entier** (§5). Le prix d'un résultat de recherche est calé à droite, le
   bouton du panier est dans le coin : ces moments-là restent à pleine
   largeur. La règle précédente — « jamais de serrage » — a été remplacée,
   pas abandonnée.
