import type { Metadata } from 'next'

import { AdminGuard } from '@/components/admin/admin-guard'
import { LeagueManager } from '@/components/admin/league-manager'
import { TeamManager } from '@/components/admin/team-manager'
import { listLeagues, listTeams } from '@/lib/catalog'

export const metadata: Metadata = { title: 'Équipes et ligues' }

export default function TeamsPage() {
  return (
    <AdminGuard>
      <TeamsScreen />
    </AdminGuard>
  )
}

async function TeamsScreen() {
  const [leagues, teams] = await Promise.all([listLeagues(), listTeams()])

  return (
    <div className="space-y-8 py-4">
      <h1 className="text-2xl font-semibold tracking-tight">Équipes et ligues</h1>

      <TeamManager
        teams={teams.map((team) => ({
          id: team.id,
          name: team.name,
          type: team.type,
          leagueId: team.leagueId,
          leagueName: team.leagueName,
          aliases: team.aliases,
        }))}
        leagues={leagues.map((league) => ({ id: league.id, name: league.name }))}
      />

      <LeagueManager
        leagues={leagues.map((league) => ({
          id: league.id,
          name: league.name,
          country: league.country,
        }))}
      />
    </div>
  )
}
