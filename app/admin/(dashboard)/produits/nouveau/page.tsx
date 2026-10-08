import type { Metadata } from 'next'

import { AdminGuard } from '@/components/admin/admin-guard'
import { ProductForm } from '@/components/admin/product-form'
import { isConfigured as isAiConfigured } from '@/lib/ai/openai'
import { listLeagues, listTeams } from '@/lib/catalog'
import { isConfigured } from '@/lib/imagekit'
import { emptyProductValues } from '@/lib/product-form-values'
import { getSettings } from '@/lib/settings'

export const metadata: Metadata = { title: 'Nouveau maillot' }

export default function NewProductPage() {
  return (
    <AdminGuard>
      <NewProductScreen />
    </AdminGuard>
  )
}

async function NewProductScreen() {
  const [teams, leagues, settings] = await Promise.all([listTeams(), listLeagues(), getSettings()])

  return (
    <div className="space-y-6 py-4">
      <h1 className="text-2xl font-semibold tracking-tight">Nouveau maillot</h1>
      <ProductForm
        values={emptyProductValues()}
        teams={teams}
        leagues={leagues}
        imagekitConfigured={isConfigured()}
        aiConfigured={isAiConfigured()}
        shipping={{ mode: settings.shippingMode, fee: settings.shippingFee }}
      />
    </div>
  )
}
