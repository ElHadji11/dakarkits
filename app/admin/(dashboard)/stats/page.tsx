import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminGuard } from '@/components/admin/admin-guard'
import { getStockAlerts } from '@/lib/catalog'
import { formatCfa } from '@/lib/constants'
import { formatPercent } from '@/lib/format'
import { getStats } from '@/lib/orders'
import { getSettings } from '@/lib/settings'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Statistiques' }

const PERIODS = [
  { value: 'jour', label: "Aujourd'hui", days: 0 },
  { value: '7j', label: '7 jours', days: 7 },
  { value: '30j', label: '30 jours', days: 30 },
] as const

export default function AdminStatsPage(props: PageProps<'/admin/stats'>) {
  return (
    <AdminGuard>
      <StatsScreen searchParams={props.searchParams} />
    </AdminGuard>
  )
}

/** Resolves the chosen period, or a custom `du`/`au` pair, into real bounds. */
function resolveRange(params: Record<string, string | string[] | undefined>) {
  const from = typeof params.du === 'string' ? new Date(`${params.du}T00:00:00Z`) : null
  const to = typeof params.au === 'string' ? new Date(`${params.au}T23:59:59Z`) : null
  if (from && to && !Number.isNaN(from.valueOf()) && !Number.isNaN(to.valueOf())) {
    return { from, to, period: 'perso' as const }
  }

  const raw = typeof params.periode === 'string' ? params.periode : '30j'
  const preset = PERIODS.find((p) => p.value === raw) ?? PERIODS[2]
  const end = new Date()
  const start = new Date(end)
  if (preset.days === 0) start.setUTCHours(0, 0, 0, 0)
  else start.setUTCDate(start.getUTCDate() - preset.days)

  return { from: start, to: end, period: preset.value }
}

async function StatsScreen({
  searchParams,
}: {
  searchParams: PageProps<'/admin/stats'>['searchParams']
}) {
  const params = await searchParams
  const { from, to, period } = resolveRange(params)

  const settings = await getSettings()
  const [stats, alerts] = await Promise.all([
    getStats({ from, to }),
    getStockAlerts(settings.lowStockThreshold),
  ])

  return (
    <div className="space-y-6 py-4">
      <h1 className="text-2xl font-semibold tracking-tight">Statistiques</h1>

      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Période">
        {PERIODS.map((item) => (
          <Link
            key={item.value}
            href={{ pathname: '/admin/stats', query: { periode: item.value } }}
            aria-current={period === item.value ? 'page' : undefined}
            className={cn(
              'flex h-11 shrink-0 items-center rounded-md border px-3 text-sm',
              period === item.value
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border text-muted-foreground',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <form method="get" className="flex flex-wrap items-end gap-2">
        <label className="space-y-1 text-xs text-muted-foreground">
          Du
          <input
            type="date"
            name="du"
            defaultValue={typeof params.du === 'string' ? params.du : ''}
            className="block h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          />
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          Au
          <input
            type="date"
            name="au"
            defaultValue={typeof params.au === 'string' ? params.au : ''}
            className="block h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          />
        </label>
        <button
          type="submit"
          className="h-11 rounded-md border border-border px-4 text-sm text-muted-foreground"
        >
          Appliquer
        </button>
      </form>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Chiffre d'affaires" value={formatCfa(stats.revenue)} hint="commandes livrées" />
        <Tile label="Nouvelles" value={String(stats.counts.new)} />
        <Tile label="Livrées" value={String(stats.counts.delivered)} />
        <Tile label="Annulées" value={String(stats.counts.cancelled)} />
        <Tile label="Taux de livraison" value={formatPercent(stats.deliveryRate)} hint="sur commandes closes" />
        <Tile label="Taux de refus" value={formatPercent(stats.refusalRate)} hint="sur commandes closes" />
      </section>

      <Table
        title="Meilleurs maillots"
        empty="Aucune vente livrée sur la période."
        head={['Maillot', 'Quantité']}
        rows={stats.topProducts.map((row) => [row.title, String(row.quantity)])}
      />

      <Table
        title="Meilleures équipes"
        empty="Aucune vente livrée sur la période."
        head={['Équipe', 'Quantité']}
        rows={stats.topTeams.map((row) => [row.team, String(row.quantity)])}
      />

      <Table
        title="Par publicité"
        empty="Aucune commande attribuée sur la période."
        head={['Source · campagne · créa', 'Commandes', 'Montant']}
        rows={stats.byCampaign.map((row) => [
          [row.source, row.campaign, row.content].filter(Boolean).join(' · ') || 'Direct',
          String(row.orders),
          formatCfa(row.amount),
        ])}
      />

      <Table
        title="Stock faible ou surréservé"
        empty="Rien à signaler."
        head={['Maillot', 'Taille', 'Stock', 'Réservé']}
        rows={alerts.map((alert) => [
          alert.title,
          alert.size,
          String(alert.quantity),
          String(alert.reserved),
        ])}
      />
    </div>
  )
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="space-y-0.5 rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function Table({
  title,
  head,
  rows,
  empty,
}: {
  title: string
  head: string[]
  rows: string[][]
  empty: string
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {head.map((cell) => (
                  <th key={cell} className="px-3 py-2 font-medium">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b border-border last:border-0">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={cn('px-3 py-2', cellIndex > 0 && 'tabular-nums')}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
