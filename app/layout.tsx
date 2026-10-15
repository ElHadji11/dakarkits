import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'

import { siteUrl } from '@/lib/constants'
import { cn } from '@/lib/utils'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans-local',
  display: 'swap',
})

/**
 * Police d'affichage, réservée aux gros titres : le mot-symbole et les montants
 * mis en avant. Elle n'a qu'une graisse et **ne possède que des capitales** —
 * jamais pour un nom de maillot, jamais pour du texte courant.
 *
 * Exposée sous `--font-display`, pas `--font-heading` : ce dernier est déjà
 * câblé dans CardTitle, Drawer, Sheet et AlertDialog de shadcn, qui doivent
 * rester en Inter.
 */
const bebas = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display-local',
  display: 'swap',
})

export const metadata: Metadata = {
  // Without this the relative `canonical` on a jersey page resolves against
  // localhost, and a shared link advertises the wrong host.
  metadataBase: new URL(siteUrl()),
  title: {
    default: 'DakarKits — maillots de foot à Dakar, payés à la livraison',
    template: '%s · DakarKits',
  },
  description:
    'Maillots de clubs, de sélections et rétro livrés sur l’axe du BRT, à Dakar. Vous payez à la livraison.',
}

export const viewport: Viewport = {
  // `--background` de Cosmic Night en sombre, en dur : une meta ne lit pas les
  // variables CSS. À resynchroniser si le thème change.
  themeColor: '#0F0F1A',
  colorScheme: 'dark',
}

// Dark mode only, no toggle: the `dark` class is set once and never changes.
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="fr" className={cn('dark', inter.variable, bebas.variable)}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
