/**
 * Corrige cinq noms d'équipe saisis de travers, une fois.
 *
 *   npx tsx scripts/fix-team-names.ts          # liste, n'écrit rien
 *   npx tsx scripts/fix-team-names.ts --write  # applique
 *
 * Relevé le 2026-10-11 en préparant `rename-products` : les titres étaient
 * incohérents, mais la cause était en amont — « Aston villa », « Manchester
 * united », « États-unis », « Stafe Rennais » et « Brazil » sont des lignes de
 * `teams`, pas des titres. Le nom d'équipe s'affiche dans le panneau Filtres,
 * en sous-titre de carte et, depuis `productName`, dans le nom de chaque
 * maillot : une faute y est visible partout à la fois.
 *
 * Les slugs ne bougent pas. Ce sont des URL, et personne ne lit un slug.
 *
 * Script jetable, gardé pour la trace : le bon endroit pour renommer une équipe
 * est /admin/equipes.
 */
import { config } from 'dotenv'
import { eq } from 'drizzle-orm'

config({ path: '.env.local', quiet: true })

/** De la valeur fautive exacte vers la bonne. */
const FIXES: Array<{ from: string; to: string }> = [
  { from: 'Aston villa', to: 'Aston Villa' },
  { from: 'Manchester united', to: 'Manchester United' },
  { from: 'États-unis', to: 'États-Unis' },
  { from: 'Stafe Rennais', to: 'Stade Rennais' },
  // La boutique est en français : « Brésil », comme le disait son ancien titre.
  { from: 'Brazil', to: 'Brésil' },
]

async function main() {
  const write = process.argv.includes('--write')

  const { db } = await import('../lib/db')
  const { teams } = await import('../lib/db/schema')

  const rows = await db.select({ id: teams.id, name: teams.name }).from(teams)
  const byName = new Map(rows.map((row) => [row.name, row.id]))

  const todo = FIXES.flatMap((fix) => {
    const id = byName.get(fix.from)
    return id === undefined ? [] : [{ id, ...fix }]
  })

  for (const fix of FIXES) {
    if (!byName.has(fix.from)) {
      console.log(`— « ${fix.from} » introuvable, déjà corrigé ou renommé autrement.`)
    }
  }

  for (const fix of todo) {
    console.log(`#${fix.id}  ${fix.from} → ${fix.to}`)
  }

  if (todo.length === 0) {
    console.log('Rien à corriger.')
    return
  }

  if (!write) {
    console.log('')
    console.log(`${todo.length} nom(s) à corriger. Relance avec --write pour appliquer.`)
    return
  }

  await db.transaction(async (tx) => {
    for (const fix of todo) {
      await tx.update(teams).set({ name: fix.to }).where(eq(teams.id, fix.id))
    }
  })

  console.log('')
  console.log(`${todo.length} nom(s) corrigé(s).`)
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error)
    process.exit(1)
  },
)
