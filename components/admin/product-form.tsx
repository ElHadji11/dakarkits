'use client'

import { Truck } from 'lucide-react'
import Link from 'next/link'
import { useActionState } from 'react'

import { saveProduct } from '@/app/admin/_actions/catalog'
import { AiFillButton } from '@/components/admin/ai-fill-button'
import { CheckboxField } from '@/components/admin/checkbox-field'
import { FieldPatchProvider } from '@/components/admin/field-patch'
import { ImageUploader, type UploaderImage } from '@/components/admin/image-uploader'
import { SelectField } from '@/components/admin/select-field'
import { SizeEditor, type SizeRow } from '@/components/admin/size-editor'
import { TeamPicker, type LeagueOption, type TeamOption } from '@/components/admin/team-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { idle } from '@/lib/action-state'
import {
  formatCfa,
  formatCfaRange,
  KIT_TYPES,
  OUTSIDE_ZONE_FEE,
  PRODUCT_STATUSES,
} from '@/lib/constants'

export type ProductFormValues = {
  id: number | null
  title: string
  price: string
  compareAtPrice: string
  teamId: number | null
  season: string
  kitType: string | null
  description: string
  isRetro: boolean
  packEligible: boolean
  status: string
  hasSizes: boolean
  sizes: SizeRow[]
  images: UploaderImage[]
  primaryIndex: number
}

/**
 * La livraison est un réglage global, pas un champ du maillot : on la rappelle
 * ici parce que le prix saisi n’est pas ce que le client paiera à la livraison.
 */
export type ShippingHint = { mode: 'fee' | 'included'; fee: number }

export function ProductForm({
  values,
  teams,
  leagues,
  imagekitConfigured,
  aiConfigured,
  shipping,
}: {
  values: ProductFormValues
  teams: TeamOption[]
  leagues: LeagueOption[]
  imagekitConfigured: boolean
  aiConfigured: boolean
  shipping: ShippingHint
}) {
  const [state, formAction, pending] = useActionState(saveProduct, idle)
  const error = (field: string) => state.fieldErrors?.[field]
  // React clears uncontrolled inputs once the action settles, so a rejected
  // form reads back what was submitted rather than the original defaults.
  const kept = (field: string, fallback: string) => state.values?.[field] ?? fallback

  return (
    <FieldPatchProvider>
      <form action={formAction} className="space-y-8 pb-24">
        {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Photos</h2>
          <ImageUploader
            configured={imagekitConfigured}
            initial={values.images}
            initialPrimary={values.primaryIndex}
          />
          <FieldError message={error('images')} />
          {aiConfigured && imagekitConfigured ? <AiFillButton /> : null}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">L’essentiel</h2>

          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              name="title"
              defaultValue={kept('title', values.title)}
              required
              autoFocus={!values.id}
              placeholder="Sénégal domicile 2024/25"
              className="h-12"
              aria-invalid={Boolean(error('title'))}
            />
            <FieldError message={error('title')} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Prix (F CFA)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                defaultValue={kept('price', values.price)}
                required
                placeholder="8000"
                className="h-12"
                aria-invalid={Boolean(error('price'))}
              />
              <FieldError message={error('price')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="compareAtPrice">Prix barré (facultatif)</Label>
              <Input
                id="compareAtPrice"
                name="compareAtPrice"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                defaultValue={kept('compareAtPrice', values.compareAtPrice)}
                placeholder="12000"
                className="h-12"
                aria-invalid={Boolean(error('compareAtPrice'))}
              />
              <FieldError message={error('compareAtPrice')} />
            </div>
          </div>

          <ShippingNote shipping={shipping} />
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Tailles et stock</h2>
          <SizeEditor initialRows={values.sizes} initialHasSizes={values.hasSizes} />
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Détails (tous facultatifs)</h2>

          <TeamPicker teams={teams} leagues={leagues} defaultTeamId={values.teamId} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="season">Saison</Label>
              <Input
                id="season"
                name="season"
                defaultValue={kept('season', values.season)}
                placeholder="2024/25"
                className="h-12"
              />
            </div>

            <SelectField
              name="kitType"
              label="Type de maillot"
              options={KIT_TYPES}
              defaultValue={values.kitType}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={kept('description', values.description)}
              rows={4}
              placeholder="Coupe, matière, détails…"
            />
          </div>

          <div className="space-y-3">
            <CheckboxField name="isRetro" label="Maillot rétro" defaultChecked={values.isRetro} />
            <CheckboxField
              name="packEligible"
              label="Éligible au pack"
              hint="Compte dans l’offre « 2 maillots pour 13 000 F »."
              defaultChecked={values.packEligible}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Publication</h2>
          <SelectField
            name="status"
            label="Statut"
            options={PRODUCT_STATUSES}
            defaultValue={values.status}
            allowEmpty={false}
          />
          <p className="text-xs text-muted-foreground">
            Il faut au moins une photo pour publier un maillot.
          </p>
        </section>

        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-5xl gap-3">
            <Button type="submit" disabled={pending} className="h-12 flex-1">
              {pending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
            <Button type="button" variant="ghost" asChild className="h-12">
              <Link href="/admin/produits">Annuler</Link>
            </Button>
          </div>
        </div>
      </form>
    </FieldPatchProvider>
  )
}

function ShippingNote({ shipping }: { shipping: ShippingHint }) {
  const paid = shipping.mode === 'fee' && shipping.fee > 0

  return (
    <p className="flex items-start gap-2 rounded-md border border-border p-3 text-xs text-muted-foreground">
      <Truck className="mt-px size-4 shrink-0" aria-hidden />
      <span>
        {paid
          ? `Sur l’axe du BRT, livraison payante : ${formatCfa(shipping.fee)} s’ajoutent au prix ci-dessus.`
          : 'Sur l’axe du BRT, livraison gratuite : le client ne paie que le prix ci-dessus.'}{' '}
        Ailleurs dans Dakar, {formatCfaRange(OUTSIDE_ZONE_FEE.min, OUTSIDE_ZONE_FEE.max)} de plus,
        selon ce que le client déclare à la commande. Vaut pour tous les maillots.{' '}
        <Link href="/admin/reglages" className="underline">
          Changer dans Réglages
        </Link>
        .
      </span>
    </p>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  )
}
