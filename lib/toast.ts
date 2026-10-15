'use client'

import type { ExternalToast } from 'sonner'

/**
 * Les toasts de la boutique, et pourquoi ils passent par un import dynamique.
 *
 * sonner pèse 72 Ko de JavaScript et 20 Ko de CSS. Les points d'appel sont
 * `FavoriteButton` — rendu par chaque carte du catalogue, donc dans le paquet
 * de la page dont le LCP se joue déjà sur le fil principal — et la fiche
 * produit. Un `import { toast } from 'sonner'` en tête de ces fichiers mettrait
 * tout sonner dans le chemin critique de ces deux pages, exactement ce que
 * `StaticGrid` et les `next/dynamic` de vaul ont servi à éviter.
 *
 * Ici, sonner n'arrive qu'au premier toast : donc jamais pour le visiteur qui
 * se contente de regarder, et une fois seulement pour les autres. L'`import
 * type` ci-dessus est effacé à la compilation, il ne coûte rien.
 *
 * Le `<Toaster>` lui-même est monté par `<ShopToaster>` dans les deux layouts
 * publics, lui aussi en chargement différé.
 */

/** Une confirmation simple : « Ajouté au panier ». */
export async function toastSuccess(message: string, options?: ExternalToast) {
  const { toast } = await import('sonner')
  toast.success(message, options)
}

/**
 * Un retrait annulable.
 *
 * Retirer un favori ou supprimer une ligne du panier étaient silencieux et
 * définitifs. Six secondes et non quatre : il faut lire la phrase, comprendre
 * ce qui vient de disparaître, puis viser un bouton — le défaut de sonner
 * suffit pour une confirmation, pas pour une décision.
 */
export async function toastUndo(
  message: string,
  { description, onUndo }: { description?: string; onUndo: () => void },
) {
  const { toast } = await import('sonner')
  toast(message, {
    description,
    duration: 6000,
    action: { label: 'Annuler', onClick: () => onUndo() },
  })
}
