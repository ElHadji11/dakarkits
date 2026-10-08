/** Dates the way the admin reads them, in Dakar time (UTC+0, no DST). */
const formatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Africa/Dakar',
})

export function formatDateTime(date: Date): string {
  return formatter.format(date)
}

export function formatPercent(value: number | null): string {
  if (value === null) return '—'
  return `${Math.round(value * 100)} %`
}
