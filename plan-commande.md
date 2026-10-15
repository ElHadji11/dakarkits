# Demande de maillot — « Commandez-nous un maillot »

Un visiteur cherche un maillot qui n'est pas au catalogue. Il peut être dans un
dépôt. Aujourd'hui il repart, et on n'apprend jamais qu'il est passé.

Ce document est le plan de la fonctionnalité. Décidé le 2026-10-15.

## Le principe qui commande tout le reste

**C'est une demande, pas une commande.** Rien n'est vendu : on ne sait pas
encore si le maillot existe en dépôt, ni à quel prix. La seule suite possible
est un appel ou un WhatsApp de notre part. Donc le formulaire ne demande que
deux choses : **de quoi identifier le maillot**, et **de quoi rappeler**.

Tout ce qui ne sert pas à l'un des deux est sorti.

### Ce qui est sorti, et pourquoi

- **L'adresse de livraison.** On ne livre rien avant d'avoir trouvé le maillot
  et fixé un prix. Et elle serait inexploitable même plus tard : `calculatePricing`
  ne lit pas une adresse, il lit une `deliveryZone` (`lib/validation/order.ts`).
  Poser la question de la zone ici obligerait à réexpliquer l'axe du BRT sur une
  page où personne n'achète encore. L'adresse se prend à l'appel, qu'on passe de
  toute façon. Elle aurait en plus ouvert une finalité de collecte de plus dans
  `/confidentialite`, pour rien.
- **Le tab glissant championnat / sélection nationale.** Son seul rôle serait de
  décider s'il faut afficher *année* et *équipe*. Mais une sélection a elle aussi
  une année (Sénégal 2022 ≠ 2026) et la sélection **est** l'équipe : les deux
  branches demandent la même chose. Un embranchement qui ne branche sur rien.
- **L'année préremplie à l'année en cours.** Un défaut est une réponse que
  personne n'a donnée — et c'est la mauvaise réponse pour toute demande rétro.
  « Cette année » est de surcroît ambigu au football : 2026, ou 2026/27 ?
- **Une liste déroulante d'équipes.** Ce serait la seule structure réellement
  utile — et elle **ne peut pas contenir la réponse**, puisque la prémisse de la
  page est « ce maillot n'est pas sur le site ». Une liste qui ne contient pas ce
  qu'on cherche est pire qu'un champ libre.

La structure ne se paierait que si elle alimentait une requête. Il n'y a pas de
table de dépôt : un humain lit la demande et appelle le fournisseur. Donc un
champ libre, et une photo qui en dit plus que trois champs.

## Le formulaire

Trois champs requis, trois facultatifs, un seul écran, aucun embranchement.

| Champ | `name` | État | Libellé / exemple |
| --- | --- | --- | --- |
| Quel maillot ? | `kit` | requis | « Ex : Juventus extérieur 2016/17 » |
| Photo | `photoUrl` | facultatif, recommandé | « Une photo nous suffit pour le reconnaître. » |
| Taille | `size` | facultatif | les pastilles `SIZES`, comme la fiche produit |
| Nom | `name` | requis | « Ex : Awa Diop » |
| Téléphone | `phone` | requis | « Ex : 77 123 45 67 » |
| Joignable sur WhatsApp | `whatsapp` | **cochée par défaut** | « Joignable sur WhatsApp ou on vous appellera. » |

**Un seul champ « Nom »**, pas « nom & prénom » : `orders.customerName` est déjà
un champ unique, et deux champs pour un nom c'est un tap de plus sans rien en
face. Il reste requis — on va appeler un inconnu à propos de 20 000 F, et
« bonjour, je parle à… ? » vaut les trois secondes de saisie.

**La case WhatsApp est cochée d'office**, et son libellé dit ce qui arrive si on
la décoche. Même raisonnement que `<DeliveryZoneChoice>` : une case vide coûte un
tap à tout le monde, et la conséquence est ici sans gravité — un appel au lieu
d'un message. Le libellé porte les deux issues, donc décocher reste un choix
informé et non un oubli.

**La taille est à ajouter** même si elle n'était pas dans la proposition : c'est
la question qu'on posera à *chaque* rappel, et elle coûte un tap sur des
pastilles qui existent déjà. Facultative.

> Note de registre : tout le site tutoie (« Ton panier est vide », « Ajoute un
> maillot »). Le libellé retenu vouvoie. À trancher d'un côté ou de l'autre avant
> de livrer — la variante tutoyée serait « Joignable sur WhatsApp, sinon on
> t'appelle ».

### L'avertissement

« **Que des maillots.** Une demande hors sujet et le numéro est bloqué. »

Juste **au-dessus du bouton d'envoi**, pas en haut de page : le haut d'un
formulaire ne se lit pas. Et il lui faut des dents — voir l'anti-abus.

## Où se trouve le bouton

**Pas dans l'en-tête.** Il fait déjà 124 px en haut de chaque page, sur la page
dont le LCP a coûté une correction documentée (`StaticGrid`, 2026-10-07). Un
quatrième contrôle y entrerait en concurrence avec le panier, c'est-à-dire avec
ce qui vend.

Les vrais moments sont ceux où le visiteur vient de ne pas trouver :

1. **Une recherche sans résultat** — `components/shop/search-box.tsx:87`,
   « Aucun maillot pour « Juventus 2016 » ». C'est la seconde la plus
   intentionnelle du site, et **la recherche préremplit le champ** :
   `/demande?q=Juventus+2016`. Ce lien vaut mieux à lui seul qu'un bouton
   d'en-tête, et il ne coûte presque rien.
2. **Le bas de la grille** — `components/shop/catalog-view.tsx:203`, là où
   quelqu'un vient de tout faire défiler sans trouver.
3. **Épuisé**, sur la fiche produit (`components/shop/product-purchase.tsx:156`).
4. **Le pied de page**, permanent et gratuit.

## Mise en œuvre

### 1. Base — `kit_requests`

```
id, number (DM-00042, sa propre séquence)
kit            text, not null        -- la demande en texte libre
photo_url      text                  -- ImageKit, vérifiée isOwnUrl()
size           size (enum)           -- null si non précisée
customer_name  text, not null
phone          varchar(20), not null -- +2217XXXXXXXX
whatsapp       boolean, not null default true
status         kit_request_status    -- 'new' | 'answered' | 'rejected'
ip             text                  -- comme les commandes : en clair
utm_*, fbclid  text                  -- l'attribution de l'atterrissage
created_at, updated_at, answered_at
index sur status, created_at, phone
```

`npm run db:generate` puis `npm run db:migrate`. Jamais de SQL direct : une
insertion à la main ne rafraîchit aucun cache.

### 2. Validation — `lib/validation/kit-request.ts`

Réutilise **`phoneField`** de `lib/validation/order.ts` (normalisation
`+2217…`, donc un numéro cliquable et ouvrable dans WhatsApp tel quel) et
`SIZES`. `kit` : 3 à 500 caractères. `photoUrl` : `isOwnUrl()` côté serveur,
jamais l'URL que le navigateur annonce.

### 3. Server Action — `app/(shop)/demande/_actions/request.ts`

- `ActionState` partagé, et **`submittedValues()`** sur `kit`, `name`, `phone` :
  React 19 vide les champs non contrôlés dès qu'une action se termine, et un
  rejet qui efface la demande sur un téléphone est rédhibitoire.
- `consume()` de `lib/rate-limit.ts`, **deux clés** : `kit-request:ip:<ip>` et
  `kit-request:phone:<phone>`, 3 par 24 h. C'est ce qui donne des dents à
  l'avertissement.
- Notification en `after()`, sur le modèle de `notifyNewOrder` : Telegram et
  e-mail depuis `settings` (`telegramChatId`, `orderEmail`), chaque canal
  indépendant et aucun ne peut faire échouer l'enregistrement. Le message porte
  le texte, la taille, le lien de la photo, et `tel:` + `wa.me/`. Sans ça une
  demande se découvre trois jours plus tard, c'est-à-dire jamais.
- Pas de `updateTag` : rien de ceci n'est au catalogue.

### 4. La photo — le seul vrai risque

Le motif existe : `uploadAuthParams()` (`lib/imagekit.ts`) signe des
identifiants courts et `components/admin/image-uploader.tsx` téléverse depuis le
navigateur. Mais l'exposer ici veut dire **une signature délivrée sans
authentification**. Donc :

- son propre dossier ImageKit (`/demandes`), jamais celui du catalogue ;
- son propre `consume()` sur l'action qui signe, avant de signer ;
- une seule photo, pas de galerie, pas de détourage (`e-bgremove` est un coût
  pour une image que personne ne publiera) ;
- `isOwnUrl()` à l'enregistrement, comme `hero_image_url`.

**Cette photo ne sort jamais de l'admin** — ni sur le site, ni dans une
publicité. C'est le plus souvent une photo produit officielle, exactement ce que
la règle sur les photos interdit, et le compte publicitaire est ce qu'on risque.

### 5. Composants

- `app/(shop)/demande/page.tsx` — la page, avec l'explication en tête : « Nous
  ne pouvons pas mettre chaque maillot sur le site, mais il est possible qu'il
  soit dans nos dépôts. » L'`await searchParams` derrière un `<Suspense>`, jamais
  au niveau de la page.
- `components/shop/kit-request-form.tsx` — client, `useActionState`, les champs
  ci-dessus, le `defaultValue` relu de `state.values`, et `q` en valeur initiale
  de `kit`.
- `components/shop/kit-request-link.tsx` — le point d'entrée réutilisable, pour
  les quatre emplacements. Il porte `q` quand il en a un.
- Espacement 8 / 16 / 24 / 32, `rounded-card`, variables Cosmic Night
  uniquement. Pas de Bebas sur autre chose qu'un gros titre.

### 6. Admin — `/admin/demandes`

Entrée dans `components/admin/admin-shell.tsx` entre Commandes et Produits, avec
le compte des `new` en pastille. Liste, puis une fiche : le texte, la photo en
grand, `tel:` et `wa.me/`, et deux boutons de statut (répondue / rejetée) comme
les commandes. Chaque action appelle `requireAdmin()` de son côté, et le corps de
la page est enveloppé dans `<AdminGuard>` — un garde de layout ne suffit pas, et
jamais de `'use cache'` ici.

### 7. Pages légales — dans le même commit

`/confidentialite` affirme ce que le code fait. Cette fonctionnalité collecte une
donnée nouvelle (une photo envoyée par le visiteur) pour une finalité nouvelle
(une demande d'approvisionnement). Donc, dans le même commit : la donnée, sa
finalité, son destinataire (ImageKit), sa conservation, et le fait que l'IP est
gardée en clair comme pour les commandes.

### 8. Mesure — facultatif

`Lead` est l'événement standard Meta pour exactement ça, sans valeur et sans
devise. À travers `lib/pixel.ts` comme tout le reste, donc inoffensif si un
bloqueur est actif.

## Hors périmètre, assumé

- Aucun rapprochement automatique avec le catalogue ou un stock : il n'y a pas de
  table de dépôt, et un humain répond.
- Aucun prix annoncé, aucun panier, aucune commande créée. La demande se
  transforme en commande **par un appel**, et la commande est saisie normalement.
- Aucun compte, aucun suivi côté client : le retour est l'appel ou le WhatsApp.

## Ordre de travail

1. Migration `kit_requests` + séquence `DM-`.
2. `lib/validation/kit-request.ts`.
3. L'action, le rate limit, la notification.
4. L'action de signature d'upload public + son rate limit.
5. La page `/demande` et le formulaire.
6. Les quatre points d'entrée, en commençant par la recherche sans résultat.
7. `/admin/demandes`.
8. `/confidentialite`.
9. `npm run lint`, `npm run typecheck`, `npm run test`.
