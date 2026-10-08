'use client'

import { Trash2 } from 'lucide-react'

import { removeProduct } from '@/app/admin/_actions/catalog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

/**
 * A jersey that already has orders is unpublished rather than deleted, so past
 * orders keep pointing at it. The server decides which; this only confirms.
 */
export function DeleteProductButton({ productId }: { productId: number }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="ghost" className="h-11 gap-2 text-destructive">
          <Trash2 className="size-4" aria-hidden />
          Supprimer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce maillot ?</AlertDialogTitle>
          <AlertDialogDescription>
            S’il a déjà été commandé, il sera dépublié au lieu d’être supprimé : les commandes
            passées doivent continuer d’y renvoyer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11">Annuler</AlertDialogCancel>
          <form action={removeProduct}>
            <input type="hidden" name="id" value={productId} />
            <AlertDialogAction type="submit" className="h-11 w-full">
              Supprimer
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
