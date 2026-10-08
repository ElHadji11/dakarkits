'use client'

import { useActionState } from 'react'

import { saveCredentials, saveProfile } from '@/app/admin/_actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { idle } from '@/lib/action-state'

export type ProfileValues = {
  shopPhone: string
  shopWhatsapp: string
  orderEmail: string
  telegramChatId: string
  loginEmail: string
}

export function ProfileForm({ values }: { values: ProfileValues }) {
  return (
    <div className="space-y-10">
      <ContactSection values={values} />
      <CredentialsSection loginEmail={values.loginEmail} />
    </div>
  )
}

function ContactSection({ values }: { values: ProfileValues }) {
  const [state, formAction, pending] = useActionState(saveProfile, idle)
  const kept = (field: string, fallback: string) => state.values?.[field] ?? fallback
  const error = (field: string) => state.fieldErrors?.[field]

  return (
    <form action={formAction} className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Coordonnées et notifications</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="shopPhone"
          label="Numéro d’appel affiché"
          placeholder="77 123 45 67"
          type="tel"
          value={kept('shopPhone', values.shopPhone)}
          error={error('shopPhone')}
        />
        <Field
          id="shopWhatsapp"
          label="Numéro WhatsApp affiché"
          placeholder="77 123 45 67"
          type="tel"
          value={kept('shopWhatsapp', values.shopWhatsapp)}
          error={error('shopWhatsapp')}
        />
      </div>

      <Field
        id="orderEmail"
        label="Email de réception des commandes"
        placeholder="toi@louyomb.com"
        type="email"
        value={kept('orderEmail', values.orderEmail)}
        error={error('orderEmail')}
      />

      <Field
        id="telegramChatId"
        label="Identifiant de discussion Telegram"
        placeholder="123456789"
        hint="Écris à ton bot, puis récupère le chat id. Vide = pas de message Telegram."
        value={kept('telegramChatId', values.telegramChatId)}
        error={error('telegramChatId')}
      />

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.ok ? <p className="text-sm text-primary">Coordonnées enregistrées.</p> : null}

      <Button type="submit" disabled={pending} className="h-12 w-full sm:w-auto">
        {pending ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
    </form>
  )
}

function CredentialsSection({ loginEmail }: { loginEmail: string }) {
  const [state, formAction, pending] = useActionState(saveCredentials, idle)
  const error = (field: string) => state.fieldErrors?.[field]

  return (
    <form action={formAction} className="space-y-4 border-t border-border pt-8">
      <h2 className="text-lg font-semibold tracking-tight">Identifiants de connexion</h2>
      <p className="text-sm text-muted-foreground">
        Changer l’un ou l’autre déconnecte tes autres appareils.
      </p>

      <Field
        id="email"
        label="Email de connexion"
        type="email"
        value={state.values?.email ?? loginEmail}
        error={error('email')}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="newPassword"
          label="Nouveau mot de passe"
          type="password"
          hint="Laisse vide pour ne pas le changer. 10 caractères minimum."
          value=""
          error={error('newPassword')}
          autoComplete="new-password"
        />
        <Field
          id="confirmPassword"
          label="Confirme le nouveau mot de passe"
          type="password"
          value=""
          error={error('confirmPassword')}
          autoComplete="new-password"
        />
      </div>

      <Field
        id="currentPassword"
        label="Ton mot de passe actuel"
        type="password"
        hint="Exigé pour toute modification."
        value=""
        error={error('currentPassword')}
        autoComplete="current-password"
        required
      />

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.ok ? <p className="text-sm text-primary">Identifiants mis à jour.</p> : null}

      <Button type="submit" disabled={pending} className="h-12 w-full sm:w-auto">
        {pending ? 'Enregistrement…' : 'Mettre à jour'}
      </Button>
    </form>
  )
}

function Field({
  id,
  label,
  value,
  error,
  hint,
  type = 'text',
  placeholder,
  autoComplete,
  required,
}: {
  id: string
  label: string
  value: string
  error?: string
  hint?: string
  type?: string
  placeholder?: string
  autoComplete?: string
  required?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="h-12"
        aria-invalid={Boolean(error)}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
