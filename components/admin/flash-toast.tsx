'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

/** Shows a one-off confirmation after a redirect, e.g. ?enregistre=1. */
export function FlashToast({ message }: { message: string | null }) {
  const shown = useRef<string | null>(null)

  useEffect(() => {
    if (!message || shown.current === message) return
    shown.current = message
    toast.success(message)
  }, [message])

  return null
}
