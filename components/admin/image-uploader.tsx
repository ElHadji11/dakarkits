'use client'

import { ArrowLeft, ArrowRight, ImageOff, Loader2, Star, Trash2, Upload } from 'lucide-react'
import NextImage from 'next/image'
import { useId, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { prepareImage, uploadAuth } from '@/app/admin/_actions/catalog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload'

export type UploaderImage = {
  key: string
  originalUrl: string
  originalFilePath: string
  cutoutUrl: string | null
  cutoutFilePath: string | null
  cutoutFileId: string | null
  useCutout: boolean
}

/** What the form posts: the chosen variant, in the chosen order. */
function serialise(images: UploaderImage[]) {
  return JSON.stringify(
    images.map((image) => {
      const cut = image.useCutout && image.cutoutUrl
      return {
        url: cut ? image.cutoutUrl : image.originalUrl,
        fileId: cut ? image.cutoutFileId : null,
        filePath: cut ? image.cutoutFilePath : image.originalFilePath,
        originalFilePath: image.originalFilePath,
        bgRemoved: Boolean(cut),
      }
    }),
  )
}

export function ImageUploader({
  configured,
  initial,
  initialPrimary,
}: {
  configured: boolean
  initial: UploaderImage[]
  initialPrimary: number
}) {
  const [images, setImages] = useState<UploaderImage[]>(initial)
  const [primary, setPrimary] = useState(initialPrimary)
  const [removeBackground, setRemoveBackground] = useState(true)
  const [busy, startUpload] = useTransition()
  const [pendingCount, setPendingCount] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragIndex = useRef<number | null>(null)
  const fieldId = useId()

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return
    setImages((current) => {
      const next = [...current]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item!)
      return next
    })
    setPrimary((current) => (current === from ? to : current === to ? from : current))
  }

  const remove = (index: number) => {
    setImages((current) => current.filter((_, i) => i !== index))
    setPrimary((current) => (index < current ? current - 1 : current === index ? 0 : current))
  }

  async function handleFiles(files: FileList) {
    const chosen = Array.from(files)
    if (chosen.length === 0) return

    setPendingCount(chosen.length)
    try {
      for (const file of chosen) {
        const auth = await uploadAuth()

        const body = new FormData()
        body.set('file', file)
        body.set('fileName', file.name)
        body.set('folder', '/dakarkits/products')
        body.set('useUniqueFileName', 'true')
        body.set('publicKey', auth.publicKey)
        body.set('token', auth.token)
        body.set('expire', String(auth.expire))
        body.set('signature', auth.signature)

        const response = await fetch(UPLOAD_URL, { method: 'POST', body })
        if (!response.ok) throw new Error(await response.text())
        const uploaded = (await response.json()) as { filePath: string }

        // Bake the cut-out once, now, so the preview costs nothing extra.
        const prepared = removeBackground
          ? await prepareImage(uploaded.filePath)
          : {
              originalUrl: '',
              originalFilePath: uploaded.filePath,
              cutoutUrl: null,
              cutoutFilePath: null,
              cutoutFileId: null,
            }

        const originalUrl =
          prepared.originalUrl ||
          `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT?.replace(/\/+$/, '')}/${uploaded.filePath.replace(/^\/+/, '')}`

        if (removeBackground && !prepared.cutoutUrl) {
          toast.warning('Fond non retiré', {
            description: `${file.name} : quota ImageKit atteint ou transformation refusée. La photo d’origine est conservée.`,
          })
        }

        setImages((current) => [
          ...current,
          {
            key: `${uploaded.filePath}-${current.length}`,
            originalUrl,
            originalFilePath: prepared.originalFilePath,
            cutoutUrl: prepared.cutoutUrl,
            cutoutFilePath: prepared.cutoutFilePath,
            cutoutFileId: prepared.cutoutFileId,
            useCutout: Boolean(prepared.cutoutUrl),
          },
        ])
        setPendingCount((n) => n - 1)
      }
    } catch (error) {
      console.error(error)
      toast.error('Envoi impossible', { description: 'Vérifie ta connexion et réessaie.' })
    } finally {
      setPendingCount(0)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  if (!configured) {
    return (
      <div className="space-y-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <ImageOff className="size-4" aria-hidden /> Photos indisponibles
        </p>
        <p>
          Renseigne <code className="text-xs">NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT</code>,{' '}
          <code className="text-xs">NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY</code> et{' '}
          <code className="text-xs">IMAGEKIT_PRIVATE_KEY</code> dans <code>.env.local</code> pour
          activer l’envoi de photos.
        </p>
        <input type="hidden" name="images" value={serialise(images)} />
        <input type="hidden" name="primaryIndex" value={primary} />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="images" value={serialise(images)} />
      <input type="hidden" name="primaryIndex" value={primary} />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          className="h-11 gap-2"
          disabled={busy || pendingCount > 0}
          onClick={() => inputRef.current?.click()}
        >
          {pendingCount > 0 ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="size-4" aria-hidden />
          )}
          {pendingCount > 0 ? `Envoi… (${pendingCount})` : 'Ajouter des photos'}
        </Button>

        <div className="flex items-center gap-2">
          <Checkbox
            id={`${fieldId}-bg`}
            checked={removeBackground}
            onCheckedChange={(value) => setRemoveBackground(value === true)}
          />
          <Label htmlFor={`${fieldId}-bg`} className="text-sm font-normal">
            Retirer le fond
          </Label>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(event) => {
          const files = event.target.files
          if (files) startUpload(() => void handleFiles(files))
        }}
      />

      {images.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          Aucune photo. Il en faut au moins une pour publier ce maillot.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => {
            const shown = image.useCutout && image.cutoutUrl ? image.cutoutUrl : image.originalUrl
            return (
              <li
                key={image.key}
                draggable
                onDragStart={() => (dragIndex.current = index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragIndex.current !== null) move(dragIndex.current, index)
                  dragIndex.current = null
                }}
                className={cn(
                  'space-y-2 rounded-lg border p-2',
                  index === primary ? 'border-primary' : 'border-border',
                )}
              >
                <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                  <NextImage
                    src={shown}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 45vw, 200px"
                    className="object-contain"
                  />
                </div>

                {/* Quatre cibles de 44 px en ligne demandent 188 px ; la carte
                    n'en fait que 147 sur un téléphone de 375 px (deux colonnes,
                    gouttière et padding déduits), et les boutons débordaient sur
                    la carte voisine. Deux rangées de deux : la cible reste
                    entière, la ligne redevient simple dès qu'il y a la place. */}
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-11 w-full"
                    aria-label="Déplacer vers la gauche"
                    onClick={() => move(index, index - 1)}
                  >
                    <ArrowLeft className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-11 w-full"
                    aria-label="Déplacer vers la droite"
                    onClick={() => move(index, index + 1)}
                  >
                    <ArrowRight className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant={index === primary ? 'default' : 'ghost'}
                    className="h-11 w-full"
                    aria-label="Définir comme photo principale"
                    aria-pressed={index === primary}
                    onClick={() => setPrimary(index)}
                  >
                    <Star className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-11 w-full text-destructive"
                    aria-label="Retirer cette photo"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>

                {image.cutoutUrl ? (
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      checked={image.useCutout}
                      onCheckedChange={(value) =>
                        setImages((current) =>
                          current.map((item, i) =>
                            i === index ? { ...item, useCutout: value === true } : item,
                          ),
                        )
                      }
                    />
                    Fond retiré
                  </label>
                ) : (
                  <p className="text-xs text-muted-foreground">Photo d’origine</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
