'use client'

import { useEffect, useRef } from 'react'

import { trackPurchase, type PixelItem } from '@/lib/pixel'

const MARKER = 'dakarkits-tracked-purchase'

/**
 * La moitié navigateur de l'achat. Le serveur envoie le même `event_id` à l'API
 * de conversions, donc Meta n'affiche qu'une vente même si deux rapports lui
 * arrivent — et il la voit encore si un bloqueur a mangé celui-ci.
 *
 * **Trois verrous contre un achat compté deux fois**, et il en faut trois :
 *
 *   1. La ref, pour le remontage StrictMode en développement.
 *   2. Le marqueur dans `localStorage`, pour le rafraîchissement et la visite
 *      ultérieure du même lien. Sans lui, un client qui recharge sa
 *      confirmation — ou qui rouvre le lien le lendemain pour retrouver son
 *      numéro — déclarerait un second achat. C'est le même mécanisme, et pour
 *      la même raison, que `ClearCartOnce`.
 *   3. `event_id`, côté Meta, qui rattrape ce que les deux premiers laissent
 *      passer : navigation privée, stockage bloqué, autre appareil.
 *
 * Le marqueur porte le numéro de commande, pas un simple booléen : une seconde
 * commande du même client, depuis le même navigateur, doit bien être comptée.
 *
 * `phone` est de la correspondance avancée, et c'est le signal qui compte ici —
 * on encaisse à la livraison, donc il n'y a ni email ni paiement en ligne à
 * rattacher à la personne qui a vu la publicité. Le Pixel le hache lui-même.
 * Ni le nom, ni l'adresse ne partent.
 */
export function PurchaseEvent({
  orderNumber,
  eventId,
  items,
  value,
  phone,
}: {
  orderNumber: string
  eventId: string
  items: PixelItem[]
  value: number
  phone: string | null
}) {
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true

    try {
      if (localStorage.getItem(MARKER) === orderNumber) return
      localStorage.setItem(MARKER, orderNumber)
    } catch {
      // Navigation privée ou stockage bloqué : `event_id` reste le filet, et
      // c'est Meta qui déduplique.
    }

    trackPurchase(eventId, items, value, phone)
  }, [orderNumber, eventId, items, value, phone])

  return null
}
