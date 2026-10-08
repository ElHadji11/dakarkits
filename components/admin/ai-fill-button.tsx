'use client'

import { Loader2, Sparkles, Undo2 } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { suggestProductFields } from '@/app/admin/_actions/ai'
import { useApplyPatch } from '@/components/admin/field-patch'
import { Button } from '@/components/ui/button'

/** Uncontrolled inputs: written straight through the DOM. */
const TEXT_FIELDS = ['title', 'description', 'season'] as const

/** Fields that own their React state: patched through the context. */
const PATCHED_FIELDS = ['kitType', 'teamId', 'isRetro'] as const

const LABELS: Record<string, string> = {
  title: 'titre',
  description: 'description',
  season: 'saison',
  kitType: 'type',
  teamId: 'équipe',
  isRetro: 'rétro',
}

type Outcome = {
  filled: string[]
  unknownTeam: string | null
  notes: string | null
  refused: string | null
}

function input(form: HTMLFormElement, name: string) {
  return form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)
}

/** Current value of a field, '' when empty — and, for `isRetro`, when absent. */
function current(form: HTMLFormElement, name: string): string {
  return input(form, name)?.value ?? ''
}

/** The uploader posts its state as JSON; we only need the URLs out of it. */
function photoUrls(form: HTMLFormElement): string[] {
  try {
    const parsed = JSON.parse(current(form, 'images') || '[]') as Array<{ url?: unknown }>
    return parsed.map((image) => image.url).filter((url): url is string => typeof url === 'string')
  } catch {
    return []
  }
}

/**
 * Reads the photos already uploaded and proposes the text fields.
 *
 * It only ever fills what is empty: the admin's own typing is never
 * overwritten, which is also why "Annuler" restores a snapshot taken at the
 * moment of filling rather than the form's original defaults.
 */
export function AiFillButton() {
  const applyPatch = useApplyPatch()
  const ref = useRef<HTMLButtonElement>(null)
  const [pending, start] = useTransition()
  const [snapshot, setSnapshot] = useState<Record<string, string> | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  const run = () => {
    const form = ref.current?.form
    if (!form) return

    const urls = photoUrls(form)
    if (urls.length === 0) {
      toast.error('Aucune photo', { description: "Téléverse d'abord une photo du maillot." })
      return
    }

    start(async () => {
      const result = await suggestProductFields(urls)
      if (!result.ok) {
        toast.error('Proposition impossible', { description: result.error })
        return
      }

      const { fields, unknownTeam, notes, refused } = result.suggestion
      const taken: Record<string, string> = {}
      for (const name of [...TEXT_FIELDS, ...PATCHED_FIELDS]) taken[name] = current(form, name)

      const filled: string[] = []
      const patch: Record<string, string> = {}

      for (const name of TEXT_FIELDS) {
        const value = fields[name]
        if (!value || taken[name]) continue
        const element = input(form, name)
        if (!element) continue
        element.value = value
        filled.push(name)
      }

      if (fields.kitType && !taken.kitType) {
        patch.kitType = fields.kitType
        filled.push('kitType')
      }
      if (fields.teamId && !taken.teamId) {
        patch.teamId = String(fields.teamId)
        filled.push('teamId')
      }
      // A checkbox is never "empty", so the rule is narrower: we only ever
      // check it, never uncheck what the admin ticked on purpose.
      if (fields.isRetro && taken.isRetro !== 'on') {
        patch.isRetro = 'on'
        filled.push('isRetro')
      }

      if (Object.keys(patch).length > 0) applyPatch(patch)
      setSnapshot(filled.length > 0 ? taken : null)
      setOutcome({ filled, unknownTeam, notes, refused })
    })
  }

  const undo = () => {
    const form = ref.current?.form
    if (!form || !snapshot) return

    for (const name of TEXT_FIELDS) {
      const element = input(form, name)
      if (element) element.value = snapshot[name] ?? ''
    }
    applyPatch(Object.fromEntries(PATCHED_FIELDS.map((name) => [name, snapshot[name] ?? ''])))

    setSnapshot(null)
    setOutcome(null)
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Remplir depuis la photo</p>
          <p className="text-xs text-muted-foreground">
            Propose titre, description, équipe, type et saison. Ne touche jamais au prix, ni aux
            champs déjà remplis. À relire avant d’enregistrer.
          </p>
        </div>
        <Button
          ref={ref}
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={run}
          className="h-11 shrink-0 gap-2"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="size-4" aria-hidden />
          )}
          {pending ? 'Lecture…' : 'Proposer'}
        </Button>
      </div>

      {outcome ? (
        <div className="space-y-2 border-t border-border pt-3 text-xs">
          <p className={outcome.filled.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
            {outcome.filled.length > 0
              ? `Rempli : ${outcome.filled.map((name) => LABELS[name]).join(', ')}.`
              : 'Rien à remplir : les champs concernés sont déjà renseignés.'}
          </p>

          {outcome.unknownTeam ? (
            <p className="text-muted-foreground">
              Équipe «&nbsp;{outcome.unknownTeam}&nbsp;» introuvable : crée-la ci-dessous, puis
              sélectionne-la.
            </p>
          ) : null}

          {outcome.notes ? <p className="text-muted-foreground">Réserve de l’IA : {outcome.notes}.</p> : null}

          {outcome.refused ? (
            <p className="text-muted-foreground">
              Le mot «&nbsp;{outcome.refused}&nbsp;» est interdit dans la boutique : le texte qui le
              contenait a été écarté.
            </p>
          ) : null}

          {snapshot ? (
            <Button type="button" variant="ghost" size="sm" onClick={undo} className="h-9 gap-2">
              <Undo2 className="size-4" aria-hidden />
              Annuler le remplissage
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
