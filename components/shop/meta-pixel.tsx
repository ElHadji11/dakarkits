import Script from 'next/script'
import { Suspense } from 'react'

import { PixelPageView } from '@/components/shop/pixel-page-view'

/**
 * Le code de base du Pixel Meta, chargé une fois par page.
 *
 * Rendu par `(shop)/layout.tsx` et `(checkout)/layout.tsx` — deux groupes de
 * routes frères, donc jamais imbriqués : exactement un pixel par page.
 * **Volontairement pas dans `app/layout.tsx`** : le layout racine enveloppe
 * aussi `/admin`, et l'admin ne doit ni charger le pixel ni envoyer le moindre
 * événement. Le mettre à la racine serait « une fois » au sens littéral et une
 * fuite au sens réel.
 *
 * `afterInteractive` : le pixel ne dispute pas la bande passante au catalogue
 * sur une connexion 4G. Sans identifiant configuré, ce composant ne rend rien
 * du tout — `window.fbq` n'existe alors pas, et `lib/pixel.ts` n'opère à vide.
 *
 * Le snippet **n'envoie pas** `PageView` : c'est `PixelPageView` qui s'en
 * charge, au premier rendu comme aux navigations suivantes. Les deux à la fois
 * compteraient deux vues au premier chargement.
 */
export function MetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  if (!pixelId) return null

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');`}
      </Script>
      {/* `Suspense` obligatoire : `PixelPageView` lit le chemin, donc une
          donnée de requête, et `cacheComponents` refuse de prérendre un
          composant client qui en dépend hors d'une frontière. Même raison et
          même traitement qu'`AttributionCapture` — la coquille reste statique,
          le pixel arrive en flux juste après. */}
      <Suspense fallback={null}>
        <PixelPageView />
      </Suspense>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  )
}
