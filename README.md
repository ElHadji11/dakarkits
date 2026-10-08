# DakarKits

Maillots de foot à Dakar, payés à la livraison. Next.js 16 · Neon · Drizzle ·
Tailwind + shadcn (Cosmic Night) · ImageKit · Resend · Telegram.

Les règles du projet sont dans [AGENTS.md](AGENTS.md). Les lire avant de coder.

## Démarrer

```bash
npm install
cp .env.example .env.local   # remplir
npm run db:migrate
npm run db:seed              # compte admin + réglages
npm run dev
```

## Commandes

| | |
|---|---|
| `npm run dev` · `build` · `start` | développement, build, production |
| `npm run typecheck` · `lint` | types et ESLint |
| `npm test` | 56 tests (prix, pack, recherche, téléphone, stock) |
| `npm run test:e2e` | parcours complet Playwright |
| `npm run photos` | prépare `references/` → `references-pretes/` |
| `npm run db:generate` · `migrate` · `seed` · `studio` | base |

`npm run photos` ne fait rien sans `--go` : il annonce d'abord le coût
(10 unités ImageKit par photo, 650 par mois). Filtre possible :
`npm run photos -- --go aston fulham`. **À l'envoi dans l'admin, décocher
« Retirer le fond »** — il est déjà retiré.

`npm run test:e2e` crée une vraie commande à chaque exécution.

## Configuration

Secrets dans `.env.local` (jamais dans `.env.example`, suivi par git) :
`DATABASE_URL`, `AUTH_SECRET`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`,
`NEXT_PUBLIC_SITE_URL`, les trois clés ImageKit, `RESEND_API_KEY`,
`RESEND_FROM`, `TELEGRAM_BOT_TOKEN`.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"  # AUTH_SECRET
```

Réglages non secrets dans **`/admin/profil`** : email de réception des
commandes, numéros affichés, identifiant Telegram. Et dans
**`/admin/reglages`** : pack, livraison, seuil de stock faible.

## Écrans

Boutique : `/` `/selections` `/retro` · `/maillot/[slug]` · `/favoris`
`/panier` `/commande` · `/confidentialite`

Admin : `/admin/commandes` `/admin/produits` `/admin/equipes` `/admin/stats`
`/admin/reglages` `/admin/profil`

## Mise en ligne

1. Importer dans Vercel, renseigner les variables avec
   `NEXT_PUBLIC_SITE_URL=https://louyomb.com`.
2. Ajouter le domaine dans Vercel, créer le DNS chez le registrar de
   `louyomb.com`.
3. `npm run db:migrate` puis `npm run db:seed` contre la base de production.
4. Renseigner `/admin/profil`.
