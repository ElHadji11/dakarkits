import type { Metadata } from 'next'

import { AdminGuard } from '@/components/admin/admin-guard'
import { SettingsForm } from '@/components/admin/settings-form'
import { getSettings } from '@/lib/settings'

export const metadata: Metadata = { title: 'Réglages' }

export default function AdminSettingsPage() {
  return (
    <AdminGuard>
      <SettingsScreen />
    </AdminGuard>
  )
}

async function SettingsScreen() {
  const settings = await getSettings()

  return (
    <div className="space-y-6 py-4">
      <h1 className="text-2xl font-semibold tracking-tight">Réglages</h1>
      <SettingsForm
        values={{
          packEnabled: settings.packEnabled,
          packPrices: Object.fromEntries(
            settings.packTiers.map((tier) => [tier.size, String(tier.price)]),
          ),
          shippingMode: settings.shippingMode,
          shippingFee: String(settings.shippingFee),
          lowStockThreshold: String(settings.lowStockThreshold),
          heroEnabled: settings.heroEnabled,
          heroTitle: settings.heroTitle ?? '',
          heroSubtitle: settings.heroSubtitle ?? '',
          heroHref: settings.heroHref ?? '',
          heroImageUrl: settings.heroImageUrl ?? '',
        }}
      />
    </div>
  )
}
