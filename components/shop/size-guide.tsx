'use client'

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { SIZE_GUIDE } from '@/lib/constants'

/**
 * Le guide des tailles, en feuille par le bas — comme les filtres, et pour la
 * même raison : c'est là qu'un pouce arrive.
 *
 * Il est monté à la demande depuis la fiche produit (`next/dynamic`), donc
 * vaul ne pèse pas sur la première peinture de la page qui vend.
 *
 * **Les mesures sont annoncées comme indicatives, et ce n'est pas une
 * prudence de façade** : les répliques viennent de plusieurs fournisseurs et
 * deux « L » ne tombent pas au même centimètre. Un tableau présenté comme
 * exact fabrique un motif de refus à la livraison, ce qui coûte plus cher
 * qu'une vente manquée.
 */
export function SizeGuide({
  open,
  onOpenChange,
  whatsapp,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Numéro WhatsApp de la boutique, quand il est réglé. */
  whatsapp: string | null
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Guide des tailles</DrawerTitle>
        </DrawerHeader>

        {/* Même correctif que le panneau Filtres : `DrawerContent` plafonne à
            `max-h-[80vh]`, donc le corps doit pouvoir rétrécir (`min-h-0`) et
            défiler lui-même, sinon le tableau pousse « J'ai compris » et le
            bouton WhatsApp hors de l'écran. Ici ça tenait de justesse sur un
            téléphone de 812 px, mais pas sur un écran de 667 px, où 80 vh ne
            font plus que 533 px. */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4">
          <p className="text-sm text-muted-foreground">
            Maillot posé à plat. <strong className="text-foreground">Largeur</strong> d&apos;une
            aisselle à l&apos;autre, <strong className="text-foreground">longueur</strong> depuis
            la base du col.
          </p>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th scope="col" className="py-2 font-medium">
                  Taille
                </th>
                <th scope="col" className="py-2 font-medium">
                  Largeur
                </th>
                <th scope="col" className="py-2 font-medium">
                  Longueur
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {SIZE_GUIDE.map((row) => (
                <tr key={row.size}>
                  <th scope="row" className="py-2 text-left font-medium">
                    {row.size}
                  </th>
                  <td className="py-2 tabular-nums">{row.chest} cm</td>
                  <td className="py-2 tabular-nums">{row.length} cm</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-xs text-muted-foreground">
            Mesures indicatives, à 2 cm près : les coupes varient d&apos;un maillot à l&apos;autre.
            Dans le doute, prends la taille au-dessus
            {whatsapp ? ' ou écris-nous sur WhatsApp' : ''}.
          </p>
        </div>

        <DrawerFooter>
          {whatsapp ? (
            <Button asChild variant="outline" className="h-12">
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
              >
                Demander sur WhatsApp
              </a>
            </Button>
          ) : null}
          <DrawerClose asChild>
            <Button className="h-12">J&apos;ai compris</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
