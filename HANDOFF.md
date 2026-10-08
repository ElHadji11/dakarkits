# Reprise de DakarKits

À coller au début d'une nouvelle conversation.

---

Je travaille sur **DakarKits**, une boutique de maillots de foot à Dakar en
paiement à la livraison, destinée à `louyomb.com`. Le projet est dans
`C:\Users\hp\Documents\1workspace\kits` (⚠️ pas dans `ecom`, qui est un autre
projet sans rapport).

**Lis d'abord `AGENTS.md` à la racine.** Il contient les règles du projet et les
pièges déjà rencontrés — ne code rien avant. Le brief d'origine est dans
`C:\Users\hp\Downloads\dakarkits-brief-claude-code.md`, le plan validé en six
phases dans `C:\Users\hp\.claude\plans\lively-cuddling-knuth.md`.

## Où ça en est

Les six phases sont construites. `npm run build`, `npm run typecheck`,
`npm run lint`, `npm test` (56 tests) et `npm run test:e2e` passent tous.

Stack : Next.js 16.4 (App Router, **Cache Components et Partial Prefetching
activés**), PostgreSQL sur Neon + Drizzle, Tailwind v4 + shadcn/ui (base Radix,
thème Cosmic Night, **mode sombre uniquement, sans bascule**), ImageKit,
Resend, bot Telegram, Zustand persistant. Interface en français, code et base
en anglais.

**Vérifié contre les vrais services** : ImageKit (upload signé navigateur,
détourage `e-bgremove`, recadrage), Resend (`last_event: delivered` sur une
vraie commande), Telegram (message reçu), le parcours client complet, le
décrément de stock à la livraison et sa restauration, les deux branches de
suppression produit, la connexion admin et ses limites de débit.

**Jamais exécuté** : Pixel Meta et API Conversions (le code existe, les clés
sont absentes — lancement prévu en organique TikTok d'abord). Et le saut
« choisir un fichier dans le sélecteur du navigateur → le téléversement
démarre » dans l'admin : tout ce qui l'entoure est vérifié, mais l'automatisation
ne sait pas produire cet événement.

## Décisions à ne pas défaire sans me demander

- **JWT maison**, pas de Better Auth, malgré ce que disent les §3 et §8 du
  brief. Une table `admin_users`, `jose` pour signer, `scrypt` de `node:crypto`
  pour hacher.
- **Trois statuts de commande** seulement : `new`, `delivered`, `cancelled`.
- **Filtrage du catalogue côté client**, sur une liste prérendue. C'est ce qui
  rend les filtres instantanés en 4G. C'est aussi ce qui plafonne Lighthouse à
  81 sur le catalogue (88 sur la fiche) : le diagnostic est fermé, 2 s de
  blocage du fil principal par l'hydratation, pas un problème réseau. Le seul
  levier restant est de repasser le filtrage côté serveur — **c'est mon
  arbitrage, pas le tien**.
- **Pas de Motion, pas de next-themes, pas de Recharts, pas de SDK** pour
  ImageKit, Resend ou Telegram : de simples appels `fetch`.
- `cacheComponents` reste **activé** (c'est le défaut de `create-next-app` 16.4).

## Pièges qui m'ont déjà coûté du temps

- Les pages boutique sont cachées jusqu'à 30 jours. **Toute mutation admin doit
  appeler `updateTag('catalog')` ou `updateTag('settings')`.** Une insertion SQL
  directe ne rafraîchit rien : il faut redémarrer `next dev` pour la voir.
- **Chaque page `/admin` doit passer par `<AdminGuard>`.** Le garde du layout ne
  suffit pas : avec `partialPrefetching`, Next prérend le segment d'une page
  indépendamment de son layout, et le contenu partait dans la coquille statique
  servie à n'importe qui.
- `params` et `searchParams` ne s'attendent jamais au niveau d'une page :
  l'`await` va derrière un `<Suspense>`.
- React 19 vide les champs non contrôlés dès qu'une action se termine. Chaque
  Server Action de formulaire renvoie `values` (voir `lib/action-state.ts`), que
  le formulaire relit en `defaultValue`.
- Le détourage ImageKit coûte **10 unités par photo sur 650 par mois**. Il est
  « cuit » une seule fois dans un fichier séparé, jamais appliqué à la volée par
  taille — sinon le quota part en treize maillots.

## Ce qu'il reste à faire

1. ~~**Mon logo**~~ — fait le 2026-10-07. Vectorisé depuis le PNG fourni, en
   place dans l'en-tête (`components/shop/logo.tsx`), le favicon
   (`app/icon.svg`, `app/favicon.ico`, `app/apple-icon.png`) et la vignette
   Open Graph par défaut (`app/opengraph-image.tsx`). Voir `AGENTS.md`. Reste
   possible : repartir du fichier vectoriel d'origine, s'il existe encore chez
   la personne qui a dessiné le logo — il aurait de vraies courbes là où le
   tracé a des polylignes.
2. **Mes vraies photos** : déballer un maillot par modèle, le photographier à
   plat à la lumière du jour, puis `npm run photos -- --go`. Ne jamais prendre
   une photo officielle sur Internet (compte publicitaire, taux de refus).
3. **Mon catalogue** : créer les maillots dans l'admin, supprimer les trois de
   démonstration.
4. **Le déploiement** : Vercel, domaine `louyomb.com`, puis
   `npm run db:migrate` et `npm run db:seed` contre la base de production.
5. Plus tard : Pixel Meta et API Conversions quand je passerai à la publicité
   payante.

## Comment je veux qu'on travaille

Phase par phase, livrée et vérifiable avant la suivante. Pose toutes tes
questions en une fois, avec ta recommandation pour chacune. Peu d'éléments,
chacun parfaitement soigné : n'ajoute aucune fonctionnalité que je n'ai pas
demandée. Ne me dis jamais qu'une chose marche si tu ne l'as pas vue marcher.

Rien n'est encore commité : les six phases sont dans l'arbre de travail.
