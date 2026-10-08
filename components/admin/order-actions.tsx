'use client'

import { Check, RotateCcw, X } from 'lucide-react'
import { useActionState, useState } from 'react'

import { changeOrderStatus } from '@/app/admin/_actions/orders'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { idle } from '@/lib/action-state'
import type { OrderStatus } from '@/lib/db/schema'

/**
 * Three buttons, sized for one thumb: this screen is used standing up, in the
 * street, while the customer waits.
 */
export function OrderActions({ orderId, status }: { orderId: number; status: OrderStatus }) {
  const [state, formAction, pending] = useActionState(changeOrderStatus, idle)
  const [cancelling, setCancelling] = useState(false)

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={orderId} />

      {cancelling ? (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <Label htmlFor="reason">Motif de l’annulation</Label>
          <Textarea
            id="reason"
            name="reason"
            rows={2}
            required
            autoFocus
            placeholder="Client injoignable, refus à la livraison…"
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              name="status"
              value="cancelled"
              variant="destructive"
              disabled={pending}
              className="h-12 flex-1"
            >
              {pending ? 'Annulation…' : 'Confirmer l’annulation'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-12"
              onClick={() => setCancelling(false)}
            >
              Retour
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {status !== 'delivered' ? (
            <Button
              type="submit"
              name="status"
              value="delivered"
              disabled={pending}
              className="h-12 flex-1 gap-2"
            >
              <Check className="size-4" aria-hidden />
              Marquer livrée
            </Button>
          ) : null}

          {status !== 'cancelled' ? (
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 gap-2"
              onClick={() => setCancelling(true)}
            >
              <X className="size-4" aria-hidden />
              Annuler
            </Button>
          ) : null}

          {status !== 'new' ? (
            <Button
              type="submit"
              name="status"
              value="new"
              variant="ghost"
              disabled={pending}
              className="h-12 gap-2"
            >
              <RotateCcw className="size-4" aria-hidden />
              Remettre en nouvelle
            </Button>
          ) : null}
        </div>
      )}

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  )
}
