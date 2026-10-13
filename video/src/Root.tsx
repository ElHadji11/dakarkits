import React from 'react'
import { Composition } from 'remotion'
import { Showreel } from './Showreel'
import { Spot } from './spot/Spot'
import { Reel } from './reel/Reel'
import { DURATION, FPS, HEIGHT, WIDTH } from './theme'
import { LEN } from './spot/timeline'
import { LEN as REEL_LEN, type Cta } from './reel/timeline'
import { HOOKS, type HookName } from './reel/hooks'

/**
 * Le produit croise des accroches et des appels a l'action.
 *
 * Trois ouvertures (`src/reel/hooks/`) et deux pastilles de fin — le post
 * organique dit ou trouver le lien, la publicite laisse le bouton de la
 * plateforme le porter. Six compositions, **un seul montage** : tout ce qui
 * est entre les deux est partage au composant pres. Une retouche faite sur
 * la parade ou sur le formulaire se voit dans les six, et il n'y a pas de
 * deuxieme endroit ou l'oublier.
 *
 * Les identifiants sont ecrits ici plutot que derives, parce qu'ils sont
 * aussi des arguments de `remotion render` dans `package.json` : un nom
 * calcule se renomme tout seul le jour ou on renomme une accroche, et la
 * commande de rendu casse sans que rien ne l'ait annonce.
 */
const REEL_HOOKS: { id: string; hook: HookName; cta: Cta }[] = [
  { id: 'Reel', hook: 'lion', cta: 'organic' },
  { id: 'ReelAd', hook: 'lion', cta: 'ads' },
  { id: 'ReelPrice', hook: 'price', cta: 'organic' },
  { id: 'ReelPriceAd', hook: 'price', cta: 'ads' },
  { id: 'ReelMarket', hook: 'market', cta: 'organic' },
  { id: 'ReelMarketAd', hook: 'market', cta: 'ads' },
]

// Le registre des accroches est la source : une accroche ajoutee la-bas et
// oubliee ici ne serait jamais rendue, et rien ne le dirait.
for (const name of Object.keys(HOOKS) as HookName[]) {
  if (!REEL_HOOKS.some((r) => r.hook === name)) {
    throw new Error(`accroche « ${name} » declaree mais sans composition dans Root.tsx`)
  }
}

/**
 * Trois formats, un seul montage.
 *
 * `Spot` ne sait pas dans quel cadre il est rendu : il demande a `useStage()`
 * et recadre. Les trois compositions ci-dessous ne different donc que par
 * leurs dimensions — jamais par leur contenu, qui resterait a resynchroniser
 * a chaque retouche.
 *
 * `Showreel` est le premier film, vertical, laisse tel quel.
 *
 * `Reel` est le troisieme, et le seul a rendre pour publier : il ouvre sur
 * les maillots et garde la marque pour la fin. Ses deux compositions ne
 * different que par la derniere pastille du carton de fin — sur un post
 * organique il faut dire ou trouver le lien, en publicite le bouton de la
 * plateforme s'en charge. Jamais deux montages : une retouche se ferait deux
 * fois, et la deuxieme fois serait oubliee.
 */
export const RemotionRoot: React.FC = () => (
  <>
    {REEL_HOOKS.map(({ id, hook, cta }) => (
      <Composition
        key={id}
        id={id}
        component={Reel}
        durationInFrames={REEL_LEN}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ hook, cta }}
      />
    ))}
    <Composition
      id="Spot"
      component={Spot}
      durationInFrames={LEN}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="SpotSquare"
      component={Spot}
      durationInFrames={LEN}
      fps={FPS}
      width={1080}
      height={1080}
    />
    <Composition
      id="SpotVertical"
      component={Spot}
      durationInFrames={LEN}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="Showreel"
      component={Showreel}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  </>
)
