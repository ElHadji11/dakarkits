import type { Metadata } from 'next'

import { AdminGuard } from '@/components/admin/admin-guard'
import { ProfileForm } from '@/components/admin/profile-form'
import { requireAdmin } from '@/lib/auth/session'
import { getSettings } from '@/lib/settings'

export const metadata: Metadata = { title: 'Mon profil' }

export default function AdminProfilePage() {
  return (
    <AdminGuard>
      <ProfileScreen />
    </AdminGuard>
  )
}

async function ProfileScreen() {
  const [session, settings] = await Promise.all([requireAdmin(), getSettings()])

  return (
    <div className="space-y-6 py-4">
      <h1 className="text-2xl font-semibold tracking-tight">Mon profil</h1>
      <ProfileForm
        values={{
          shopPhone: settings.shopPhone ?? '',
          shopWhatsapp: settings.shopWhatsapp ?? '',
          orderEmail: settings.orderEmail ?? '',
          telegramChatId: settings.telegramChatId ?? '',
          loginEmail: session.email,
        }}
      />
    </div>
  )
}
