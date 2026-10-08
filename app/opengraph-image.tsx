import { ImageResponse } from 'next/og'

import { LOGO_PATH, LOGO_RATIO, LOGO_VIEWBOX } from '@/components/shop/logo'

/**
 * Vignette par défaut : celle qui s'affiche quand on colle `louyomb.com` dans
 * WhatsApp. Les fiches maillot n'y passent pas — elles ont la photo du maillot,
 * posée dans leur `generateMetadata`.
 *
 * Générée une seule fois au build : la route est statique, donc Next en fait un
 * PNG servi par le CDN. Rien ne tourne à l'exécution.
 *
 * Satori ne lit pas les variables CSS du thème : les couleurs sont écrites ici,
 * ce sont `--background`, `--foreground`, `--muted-foreground` et `--primary` de
 * Cosmic Night en sombre. À resynchroniser si le thème change.
 */
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'DakarKits — maillots de foot à Dakar, payés à la livraison'

const MARK_HEIGHT = 132

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 46,
          background: '#0F0F1A',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <svg
            width={MARK_HEIGHT * LOGO_RATIO}
            height={MARK_HEIGHT}
            viewBox={LOGO_VIEWBOX}
          >
            <path d={LOGO_PATH} fill="#A48FFF" fillRule="evenodd" />
          </svg>
          <div style={{ fontSize: 108, fontWeight: 700, color: '#E2E2F5', letterSpacing: -2 }}>
            DakarKits
          </div>
        </div>
        <div style={{ fontSize: 44, color: '#A0A0C0' }}>
          Maillots de foot à Dakar · payés à la livraison
        </div>
      </div>
    ),
    size,
  )
}
