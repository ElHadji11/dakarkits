'use client'

import { Pencil, Trash2, X } from 'lucide-react'
import { useActionState, useState } from 'react'

import { deleteTeam, saveTeam } from '@/app/admin/_actions/catalog'
import { SelectField } from '@/components/admin/select-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { idle } from '@/lib/action-state'
import { TEAM_TYPES } from '@/lib/constants'

export type TeamRow = {
  id: number
  name: string
  type: 'club' | 'national'
  leagueId: number | null
  leagueName: string | null
  aliases: string | null
}

export function TeamManager({
  teams,
  leagues,
}: {
  teams: TeamRow[]
  leagues: Array<{ id: number; name: string }>
}) {
  const [state, formAction, pending] = useActionState(saveTeam, idle)
  const [editing, setEditing] = useState<TeamRow | null>(null)
  const kept = (field: string, fallback: string) => state.values?.[field] ?? fallback

  const key = editing ? `edit-${editing.id}` : 'create'

  // A successful save ends the edit. Adjusted during render rather than in an
  // effect, so there is no extra pass showing the stale form.
  const [sawOk, setSawOk] = useState(state.ok)
  if (state.ok !== sawOk) {
    setSawOk(state.ok)
    if (state.ok) setEditing(null)
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Équipes</h2>

      <form key={key} action={formAction} className="space-y-3 rounded-lg border border-border p-3">
        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

        <div className="space-y-2">
          <Label htmlFor="team-name">Nom</Label>
          <Input
            id="team-name"
            name="name"
            defaultValue={kept('name', editing?.name ?? '')}
            placeholder="FC Barcelone"
            className="h-12"
            required
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            name="type"
            label="Type"
            options={TEAM_TYPES}
            defaultValue={editing?.type ?? 'club'}
            allowEmpty={false}
          />
          <SelectField
            name="leagueId"
            label="Ligue"
            placeholder="Aucune"
            options={leagues.map((league) => ({ value: String(league.id), label: league.name }))}
            defaultValue={editing?.leagueId ? String(editing.leagueId) : null}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="team-aliases">Autres orthographes (facultatif)</Label>
          <Input
            id="team-aliases"
            name="aliases"
            defaultValue={kept('aliases', editing?.aliases ?? '')}
            placeholder="barca, fcb, barcelona"
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">
            Séparées par des virgules. Elles servent à la recherche : « barca » doit trouver le FC
            Barcelone.
          </p>
        </div>

        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button type="submit" disabled={pending} className="h-11">
            {pending ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Ajouter l’équipe'}
          </Button>
          {editing ? (
            <Button
              type="button"
              variant="ghost"
              className="h-11 gap-1"
              onClick={() => setEditing(null)}
            >
              <X className="size-4" aria-hidden />
              Annuler
            </Button>
          ) : null}
        </div>
      </form>

      {teams.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune équipe pour l’instant.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {teams.map((team) => (
            <li key={team.id} className="flex items-center gap-2 p-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{team.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {team.type === 'national' ? 'Sélection' : (team.leagueName ?? 'Club')}
                </p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-11"
                aria-label={`Modifier ${team.name}`}
                onClick={() => setEditing(team)}
              >
                <Pencil className="size-4" aria-hidden />
              </Button>
              <form action={deleteTeam}>
                <input type="hidden" name="id" value={team.id} />
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="size-11 text-destructive"
                  aria-label={`Supprimer ${team.name}`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
