'use client'

import { useActionState } from 'react'

import { saveShopSettings } from '@/app/admin/_actions/settings'
import { CheckboxField } from '@/components/admin/checkbox-field'
import { SelectField } from '@/components/admin/select-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { idle } from '@/lib/action-state'
import { PACK_TIER_SIZES, packPriceField } from '@/lib/constants'

export type ShopSettingsValues = {
  packEnabled: boolean
  /** Le prix de chaque palier, indexé par nombre de maillots. '' = éteint. */
  packPrices: Record<number, string>
  shippingMode: string
  shippingFee: string
  lowStockThreshold: string
  heroEnabled: boolean
  heroTitle: string
  heroSubtitle: string
  heroHref: string
  heroImageUrl: string
}

export function SettingsForm({ values }: { values: ShopSettingsValues }) {
  const [state, formAction, pending] = useActionState(saveShopSettings, idle)
  const kept = (field: string, fallback: string) => state.values?.[field] ?? fallback
  const error = (field: string) => state.fieldErrors?.[field]

  return (
    <form action={formAction} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Pack</h2>

        <CheckboxField
          name="packEnabled"
          label="Pack actif"
          hint="Décoche pour vendre chaque maillot à son prix."
          defaultChecked={values.packEnabled}
        />

        <p className="text-xs text-muted-foreground">
          Un prix global par nombre de maillots. Laisse vide pour éteindre un palier. Le panier
          prend toujours le barème le plus avantageux pour le client, et jamais s&apos;il dépasse
          la somme des prix affichés.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {PACK_TIER_SIZES.map((size) => {
            const field = packPriceField(size)
            return (
              <div key={size} className="space-y-2">
                <Label htmlFor={field}>{size} maillots (F CFA)</Label>
                <Input
                  id={field}
                  name={field}
                  type="number"
                  min={1}
                  inputMode="numeric"
                  placeholder="Pas de pack"
                  defaultValue={kept(field, values.packPrices[size] ?? '')}
                  className="h-12"
                />
                <FieldError message={error(field)} />
              </div>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Livraison</h2>

        <SelectField
          name="shippingMode"
          label="Mode"
          options={[
            { value: 'fee', label: 'Frais ajoutés au total' },
            { value: 'included', label: 'Livraison incluse dans le prix' },
          ]}
          defaultValue={values.shippingMode}
          allowEmpty={false}
        />

        <div className="space-y-2">
          <Label htmlFor="shippingFee">Frais de livraison (F CFA)</Label>
          <Input
            id="shippingFee"
            name="shippingFee"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={kept('shippingFee', values.shippingFee)}
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">
            Ignoré quand la livraison est incluse : le site affiche alors « Livraison incluse
            partout à Dakar ».
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Stock</h2>
        <div className="space-y-2">
          <Label htmlFor="lowStockThreshold">Seuil de stock faible</Label>
          <Input
            id="lowStockThreshold"
            name="lowStockThreshold"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={kept('lowStockThreshold', values.lowStockThreshold)}
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">
            En dessous ou à égalité, la fiche affiche « Plus que N en taille M » et la taille
            remonte dans les alertes.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Bannière d&apos;accueil</h2>

        <CheckboxField
          name="heroEnabled"
          label="Bannière active"
          hint="Décoche pour que l’accueil ouvre directement sur la grille."
          defaultChecked={values.heroEnabled}
        />

        <div className="space-y-2">
          <Label htmlFor="heroTitle">Titre</Label>
          <Input
            id="heroTitle"
            name="heroTitle"
            maxLength={80}
            placeholder="Ex : La collection Sénégal"
            defaultValue={kept('heroTitle', values.heroTitle)}
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">
            Affiché en capitales condensées : la police d’affichage n’a pas de minuscules.
          </p>
          <FieldError message={error('heroTitle')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="heroSubtitle">Sous-titre</Label>
          <Input
            id="heroSubtitle"
            name="heroSubtitle"
            maxLength={160}
            placeholder="Ex : Domicile, extérieur et rétro, livrés à Dakar"
            defaultValue={kept('heroSubtitle', values.heroSubtitle)}
            className="h-12"
          />
          <FieldError message={error('heroSubtitle')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="heroHref">Lien</Label>
          <Input
            id="heroHref"
            name="heroHref"
            placeholder="/selections"
            defaultValue={kept('heroHref', values.heroHref)}
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">
            Un chemin du site : <code>/selections</code>, <code>/clubs</code>, <code>/retro</code>,
            ou un filtre comme <code>/?equipe=3</code>. Jamais une adresse extérieure.
          </p>
          <FieldError message={error('heroHref')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="heroImageUrl">Photo (facultatif)</Label>
          <Input
            id="heroImageUrl"
            name="heroImageUrl"
            placeholder="Laisse vide : la photo du maillot le plus récent du lien"
            defaultValue={kept('heroImageUrl', values.heroImageUrl)}
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">
            Une URL d’image de la boutique uniquement — copie-la depuis les photos d’un maillot.
            Jamais une photo trouvée sur Internet : c’est le visuel que Meta regarde en premier.
          </p>
          <FieldError message={error('heroImageUrl')} />
        </div>
      </section>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.ok ? <p className="text-sm text-primary">Réglages enregistrés.</p> : null}

      <Button type="submit" disabled={pending} className="h-12 w-full sm:w-auto">
        {pending ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
    </form>
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
