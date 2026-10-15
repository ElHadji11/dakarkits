'use client'

import { useParams } from 'next/navigation'

import { KitPhoto } from '@/components/shop/kit-photo'
import { useHydrated } from '@/hooks/use-hydrated'

/**
 * Le squelette de la fiche produit, rendu par le `<Suspense>` de la page
 * tant que `params` n'est pas lu.
 *
 * Son bloc image porte **le même nom de transition que la photo de la
 * carte**. Le glissement carte → fiche ne joue que si la fiche se rend dans le
 * même commit que la navigation ; sur une 4G lente, c'est ce squelette qui
 * passe d'abord, et sans ce nom la paire ne se formerait pas — la photo
 * disparaîtrait de la grille et le squelette apparaîtrait à côté. Avec, la
 * photo glisse jusqu'au bloc gris, puis le bloc gris cède la place à la vraie
 * photo au même endroit.
 *
 * Composant client pour une seule raison : le squelette doit connaître le
 * slug *avant* que la page ait attendu `params`, et `useParams` le lit dans
 * le routeur, sans rien attendre. L'await de la page reste derrière son
 * `<Suspense>`, comme le veut la règle de la coquille statique.
 *
 * **Le nom n'est posé qu'après l'hydratation.** Au premier chargement d'une
 * fiche, le HTML arrive squelette d'abord, contenu ensuite, et React 19.2
 * anime ce relais de streaming comme n'importe quelle apparition de
 * `<Suspense>`. Avec le nom des deux côtés, la fiche jouait donc un morph
 * squelette → photo *pendant le premier affichage*, sur la photo qui fait le
 * LCP — vérifié dans Chrome le 2026-10-15. Le squelette ne sert à la paire
 * qu'en navigation côté client, où il se monte après l'hydratation et porte
 * donc bien son nom.
 */
export function ProductSkeleton() {
  const params = useParams<{ slug?: string }>()
  const hydrated = useHydrated()
  const slug = hydrated && typeof params?.slug === 'string' ? params.slug : null

  const block = <div className="aspect-square rounded-lg bg-muted" />

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8" aria-hidden>
      {slug ? <KitPhoto slug={slug}>{block}</KitPhoto> : block}
      <div className="space-y-4">
        <div className="h-8 w-3/4 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="h-10 w-40 rounded bg-muted" />
        <div className="h-12 w-full rounded bg-muted" />
      </div>
    </div>
  )
}
