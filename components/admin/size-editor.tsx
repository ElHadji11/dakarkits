'use client'

import { useId, useState } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SIZES, type Size } from '@/lib/constants'

export type SizeRow = {
  size: Size
  available: boolean
  /** Empty string means no stock tracking: no count, no alert, no decrement. */
  quantity: string
}

export function defaultSizeRows(): SizeRow[] {
  return SIZES.map((size) => ({ size, available: true, quantity: '' }))
}

/**
 * Three states, and the difference is what the shop reads:
 *   - the switch off      -> no rows at all -> jersey sold with no size picker
 *   - rows, some checked  -> those sizes are orderable
 *   - rows, none checked  -> "Épuisé"
 * Unchecking keeps the row, so the quantity you typed survives.
 */
export function SizeEditor({
  initialRows,
  initialHasSizes,
}: {
  initialRows: SizeRow[]
  initialHasSizes: boolean
}) {
  const [hasSizes, setHasSizes] = useState(initialHasSizes)
  const [rows, setRows] = useState<SizeRow[]>(initialRows)
  const fieldId = useId()

  const update = (size: Size, patch: Partial<SizeRow>) =>
    setRows((current) => current.map((row) => (row.size === size ? { ...row, ...patch } : row)))

  const payload = JSON.stringify(
    rows.map((row) => ({
      size: row.size,
      available: row.available,
      quantity: row.quantity.trim() === '' ? null : Number(row.quantity),
    })),
  )

  return (
    <div className="space-y-4">
      <input type="hidden" name="sizes" value={payload} />
      {hasSizes ? <input type="hidden" name="hasSizes" value="on" /> : null}

      <div className="flex items-center gap-2">
        <Checkbox
          id={`${fieldId}-has`}
          checked={hasSizes}
          onCheckedChange={(value) => setHasSizes(value === true)}
        />
        <Label htmlFor={`${fieldId}-has`} className="font-normal">
          Ce maillot se décline en tailles
        </Label>
      </div>

      {hasSizes ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Laisse la quantité vide pour ne pas suivre le stock. Si tu la renseignes, elle diminue
            quand la commande passe à « livrée » et la taille se décoche seule à zéro.
          </p>

          <ul className="divide-y divide-border rounded-lg border border-border">
            {rows.map((row) => (
              <li key={row.size} className="flex items-center gap-3 p-2">
                <Checkbox
                  id={`${fieldId}-${row.size}`}
                  checked={row.available}
                  onCheckedChange={(value) => update(row.size, { available: value === true })}
                />
                <Label
                  htmlFor={`${fieldId}-${row.size}`}
                  className="w-12 text-base font-medium tabular-nums"
                >
                  {row.size}
                </Label>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="non suivi"
                  aria-label={`Quantité en taille ${row.size}`}
                  value={row.quantity}
                  onChange={(event) => update(row.size, { quantity: event.target.value })}
                  className="ml-auto h-11 w-32"
                />
              </li>
            ))}
          </ul>

          {rows.every((row) => !row.available) ? (
            <p className="text-sm text-muted-foreground">
              Aucune taille cochée : le maillot s’affichera « Épuisé » et ne sera pas commandable.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Le maillot sera commandable directement, sans choix de taille.
        </p>
      )}
    </div>
  )
}
