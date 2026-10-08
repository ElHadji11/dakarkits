'use client'

import { Pencil, Trash2, X } from 'lucide-react'
import { useActionState, useState } from 'react'

import { deleteLeague, saveLeague } from '@/app/admin/_actions/catalog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { idle } from '@/lib/action-state'

export type LeagueRow = { id: number; name: string; country: string | null }

export function LeagueManager({ leagues }: { leagues: LeagueRow[] }) {
  const [state, formAction, pending] = useActionState(saveLeague, idle)
  const [editing, setEditing] = useState<LeagueRow | null>(null)
  const kept = (field: string, fallback: string) => state.values?.[field] ?? fallback

  // One form for both create and edit: on mobile that is one thing to look at,
  // not two.
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
      <h2 className="text-lg font-semibold tracking-tight">Ligues</h2>

      <form key={key} action={formAction} className="space-y-3 rounded-lg border border-border p-3">
        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="league-name">Nom</Label>
            <Input
              id="league-name"
              name="name"
              defaultValue={kept('name', editing?.name ?? '')}
              placeholder="Premier League"
              className="h-12"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="league-country">Pays (facultatif)</Label>
            <Input
              id="league-country"
              name="country"
              defaultValue={kept('country', editing?.country ?? '')}
              placeholder="Angleterre"
              className="h-12"
            />
          </div>
        </div>

        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button type="submit" disabled={pending} className="h-11">
            {pending ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Ajouter la ligue'}
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

      {leagues.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune ligue pour l’instant.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {leagues.map((league) => (
            <li key={league.id} className="flex items-center gap-2 p-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{league.name}</p>
                {league.country ? (
                  <p className="truncate text-sm text-muted-foreground">{league.country}</p>
                ) : null}
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-11"
                aria-label={`Modifier ${league.name}`}
                onClick={() => setEditing(league)}
              >
                <Pencil className="size-4" aria-hidden />
              </Button>
              <form action={deleteLeague}>
                <input type="hidden" name="id" value={league.id} />
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="size-11 text-destructive"
                  aria-label={`Supprimer ${league.name}`}
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
