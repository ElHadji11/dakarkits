'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SIZES, type Size } from '@/lib/constants'
import { cn } from '@/lib/utils'

export type Filters = {
  teamId: number | null
  leagueId: number | null
  size: Size | null
  min: string
  max: string
}

export const emptyFilters: Filters = { teamId: null, leagueId: null, size: null, min: '', max: '' }

export function countActive(filters: Filters): number {
  return [
    filters.teamId !== null,
    filters.leagueId !== null,
    filters.size !== null,
    filters.min !== '',
    filters.max !== '',
  ].filter(Boolean).length
}

/**
 * A bottom sheet on every screen: one implementation, and it is where a thumb
 * is. Mounted only once the filters are opened, which keeps vaul out of the
 * catalogue's first paint.
 */
export function FilterDrawer({
  open,
  onOpenChange,
  filters,
  teams,
  leagues,
  onApply,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: Filters
  teams: Array<{ id: number; name: string }>
  leagues: Array<{ id: number; name: string }>
  onApply: (next: Filters) => void
}) {
  const [draft, setDraft] = useState(filters)

  const show = (next: boolean) => {
    if (next) setDraft(filters)
    onOpenChange(next)
  }

  const apply = () => {
    onApply(draft)
    onOpenChange(false)
  }

  const reset = () => {
    setDraft(emptyFilters)
    onApply(emptyFilters)
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={show}>
      <DrawerContent>
        {/* `flex min-h-0 flex-1 flex-col` et non un simple bloc : `DrawerContent`
            est une colonne flex plafonnée à `max-h-[80vh]`, et un enfant sans
            `min-h-0` refuse de rétrécir sous sa hauteur naturelle. Le panneau
            faisait donc 1 947 px dans une boîte de 649 px : sur un téléphone de
            812 px de haut, « Taille disponible », « Prix » et le bouton « Voir
            les maillots » tombaient 367 px sous le bord de l'écran, sans aucun
            moyen d'y accéder — rien ne défilait. Mesuré le 2026-10-15 sur
            louyomb.com en 375 × 812. */}
        <div className="mx-auto flex w-full min-h-0 max-w-lg flex-1 flex-col">
          <DrawerHeader>
            <DrawerTitle>Filtres</DrawerTitle>
          </DrawerHeader>

          {/* Le corps défile, l'en-tête et le pied restent en place.
              `overscroll-contain` arrête la chaîne au bord de la liste : sans
              lui, continuer le geste vers le bas déclenche le
              pull-to-refresh d'Android Chrome, qui recharge la page et ferme
              le panneau au milieu d'un choix de filtres. */}
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 pb-2">
            <Chooser
              label="Club ou sélection"
              options={teams}
              value={draft.teamId}
              onChange={(teamId) => setDraft((d) => ({ ...d, teamId }))}
            />

            {leagues.length > 0 ? (
              <Chooser
                label="Ligue"
                options={leagues}
                value={draft.leagueId}
                onChange={(leagueId) => setDraft((d) => ({ ...d, leagueId }))}
              />
            ) : null}

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Taille disponible</legend>
              <div className="flex flex-wrap gap-2">
                <Pill
                  active={draft.size === null}
                  onClick={() => setDraft((d) => ({ ...d, size: null }))}
                >
                  Toutes
                </Pill>
                {SIZES.map((size) => (
                  <Pill
                    key={size}
                    active={draft.size === size}
                    onClick={() => setDraft((d) => ({ ...d, size }))}
                  >
                    {size}
                  </Pill>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Prix (F CFA)</legend>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="filter-min" className="text-xs text-muted-foreground">
                    Minimum
                  </Label>
                  <Input
                    id="filter-min"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="0"
                    className="h-12"
                    value={draft.min}
                    onChange={(event) => setDraft((d) => ({ ...d, min: event.target.value }))}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="filter-max" className="text-xs text-muted-foreground">
                    Maximum
                  </Label>
                  <Input
                    id="filter-max"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="—"
                    className="h-12"
                    value={draft.max}
                    onChange={(event) => setDraft((d) => ({ ...d, max: event.target.value }))}
                  />
                </div>
              </div>
            </fieldset>
          </div>

          <DrawerFooter className="flex-row gap-4">
            <Button variant="ghost" className="h-12 flex-1" onClick={reset}>
              Tout effacer
            </Button>
            <DrawerClose asChild>
              <Button className="h-12 flex-1" onClick={apply}>
                Voir les maillots
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function Chooser({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ id: number; name: string }>
  value: number | null
  onChange: (id: number | null) => void
}) {
  if (options.length === 0) return null

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        <Pill active={value === null} onClick={() => onChange(null)}>
          Tous
        </Pill>
        {options.map((option) => (
          <Pill
            key={option.id}
            active={value === option.id}
            onClick={() => onChange(value === option.id ? null : option.id)}
          >
            {option.name}
          </Pill>
        ))}
      </div>
    </fieldset>
  )
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex h-11 items-center rounded-full border px-4 text-sm transition-colors',
        active
          ? 'border-primary bg-primary/15 text-foreground'
          : 'border-border text-muted-foreground',
      )}
    >
      {children}
    </button>
  )
}
