'use client'

import { Plus, X } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { quickCreateTeam } from '@/app/admin/_actions/catalog'
import { useFieldPatch } from '@/components/admin/field-patch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TEAM_TYPES } from '@/lib/constants'

export type TeamOption = { id: number; name: string }
export type LeagueOption = { id: number; name: string }

const NONE = 'none'

/**
 * Team select with an inline "new team" panel. Not a nested <form> — HTML
 * forbids that — so it calls the action directly and selects the result.
 */
export function TeamPicker({
  teams,
  leagues,
  defaultTeamId,
}: {
  teams: TeamOption[]
  leagues: LeagueOption[]
  defaultTeamId: number | null
}) {
  const [options, setOptions] = useState(teams)
  const [value, setValue] = useState(defaultTeamId ? String(defaultTeamId) : NONE)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<'club' | 'national'>('club')
  const [leagueId, setLeagueId] = useState(NONE)
  const [pending, startTransition] = useTransition()

  useFieldPatch('teamId', (patched) => setValue(patched === '' ? NONE : patched))

  const create = () => {
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      toast.error('Nom trop court')
      return
    }

    startTransition(async () => {
      const result = await quickCreateTeam({
        name: trimmed,
        type,
        leagueId: leagueId === NONE ? null : Number(leagueId),
      })

      if ('error' in result) {
        toast.error('Création impossible', { description: result.error })
        return
      }

      setOptions((current) => [...current, result].sort((a, b) => a.name.localeCompare(b.name)))
      setValue(String(result.id))
      setName('')
      setOpen(false)
      toast.success(`${result.name} ajoutée`)
    })
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="teamId" value={value === NONE ? '' : value} />

      <div className="flex items-center justify-between">
        <Label htmlFor="team-select">Équipe</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-11 gap-1"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
          {open ? 'Annuler' : 'Nouvelle équipe'}
        </Button>
      </div>

      <Select value={value} onValueChange={setValue}>
        <SelectTrigger id="team-select" className="h-12 w-full">
          <SelectValue placeholder="Aucune" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Aucune</SelectItem>
          {options.map((team) => (
            <SelectItem key={team.id} value={String(team.id)}>
              {team.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {open ? (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <div className="space-y-2">
            <Label htmlFor="quick-team-name">Nom de l’équipe</Label>
            <Input
              id="quick-team-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="FC Barcelone"
              className="h-12"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quick-team-type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as 'club' | 'national')}>
                <SelectTrigger id="quick-team-type" className="h-12 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {type === 'club' ? (
              <div className="space-y-2">
                <Label htmlFor="quick-team-league">Ligue</Label>
                <Select value={leagueId} onValueChange={setLeagueId}>
                  <SelectTrigger id="quick-team-league" className="h-12 w-full">
                    <SelectValue placeholder="Aucune" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Aucune</SelectItem>
                    {leagues.map((league) => (
                      <SelectItem key={league.id} value={String(league.id)}>
                        {league.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          <Button type="button" className="h-11 w-full" disabled={pending} onClick={create}>
            {pending ? 'Création…' : 'Créer et sélectionner'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
