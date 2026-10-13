import React from 'react'
import { Img, staticFile } from 'remotion'
import { EASE, lerp } from '../components/anim'
import { C } from '../theme'
import { MASCOT } from './mascot-asset'

/**
 * Le lion — la mascotte de DakarKits.
 *
 * **Il est a nous.** Les deux photos qui ont lance cette piste montraient la
 * mascotte des Jeux Olympiques de la Jeunesse Dakar 2026, photographiee a sa
 * ceremonie de lancement. Elle n'a rien a faire dans une publicite pour une
 * boutique de repliques, et pour trois raisons qui vont toutes dans le meme
 * sens que la regle sur les photos (`AGENTS.md`) :
 *
 *  1. **Le compte publicitaire.** Les marques olympiques sont parmi les plus
 *     surveillees au monde, et leur detection est automatique. C'est la
 *     facon la plus rapide de perdre le compte Meta dont depend tout le
 *     trafic de la boutique.
 *  2. **Ce sont les marques d'un tiers**, anneaux et millesime compris. Les
 *     reprendre laisse entendre un lien qui n'existe pas — exactement ce que
 *     la regle « jamais officiel ni authentique » existe pour empecher.
 *  3. Les deux photos montrent des **personnes reelles identifiables**, dont
 *     un chef d'Etat.
 *
 * Celui-ci a donc ete dessine pour la boutique : un lion — le symbole du pays
 * et de son equipe, qui n'appartient a personne — en maillot uni violet, sans
 * ecusson, sans anneaux, sans millesime, sans texte. Il est detoure par
 * `scripts/make-mascot.mjs`, et sa source est `assets/mascot/`.
 */

/**
 * La bouche ne s'anime pas, et c'est un choix — trois pistes l'ont precede.
 *
 * Le lion est genere **bouche ouverte**, en train de parler : c'est l'etat
 * qu'on voit pendant les deux secondes ou il est a l'image.
 *
 *  1. **Deux etats et un fondu.** Un second rendu « bouche fermee » a ete
 *     demande au meme modele, en lui donnant le premier en reference. Il a
 *     rendu une tete plus petite et plus haute, une criniere differente, des
 *     yeux plus grands. Le fondu ne montrait pas une bouche qui se ferme,
 *     il montrait une tete qui change. Aucun recalage ne rattrape une
 *     criniere redessinee.
 *  2. **Le menton qui remonte**, par decalage vertical de l'image dans une
 *     fenetre ovale posee sur la cavite. Le menton a sa forme propre,
 *     arrondie : remonte, il posait deux bosses de poil clair au milieu de la
 *     bouche.
 *  3. **La machoire haute qui descend**, meme fenetre, par ecrasement
 *     vertical vers la levre inferieure. Mieux, mais pas bon : la cavite est
 *     plus grande que toute fenetre qui tienne a l'interieur du museau, donc
 *     il en restait toujours un croissant sombre **en dehors** de la fenetre,
 *     a cote de la version ecrasee. Un contour double, et ca se lit comme un
 *     defaut d'affichage. Elargir la fenetre pour tout couvrir la faisait
 *     mordre sur le contour de la joue, qui se dedoublait a son tour.
 *
 * Ce qui porte la parole, donc : le corps. Il se redresse sur les syllabes
 * fortes, la tete suit avec un temps de retard, et le tout respire. A la
 * vitesse d'un reel, avec la voix, un personnage qui accentue au bon moment
 * se lit comme un personnage qui parle — alors qu'une bouche qui clignote
 * entre deux formes mal raccordees se lit comme une erreur.
 *
 * Une vraie articulation demanderait un rendu video de synchronisation
 * labiale : environ 1 940 credits par seconde, soit pres de 4 000 pour ces
 * deux secondes. C'est la seule facon de faire mieux, et elle se paie.
 */

/**
 * Le lion, pose dans le cadre, qui parle si on lui donne une frame de voix.
 *
 * `voiceFrame` est l'index dans `voice` — donc dans la voix off elle-meme,
 * pas dans le plan. Un plan ou le lion se tait passe `undefined` et la bouche
 * reste presque fermee.
 */
export const Mascot: React.FC<{
  /** Hauteur du lion dans le cadre, en pixels de composition. */
  height: number
  /** Position du **bas** du lion ; il est cadre a la taille. */
  bottom: number
  /** Centre horizontal. */
  centerX: number
  /** Frame de la voix off, pour la bouche. */
  voiceFrame?: number
  /**
   * L'enveloppe de la voix qui parle sur ce plan.
   *
   * Elle est passee et non importee : depuis que l'accroche est un parametre
   * du film (`src/reel/hooks/`), il y a une voix par accroche et donc
   * plusieurs enveloppes. Un `import` fige le lion sur celle du premier
   * montage, et il accentuerait sur les syllabes d'une phrase qu'on n'entend
   * plus.
   */
  voice?: readonly number[]
  /** 0 = absent, 1 = pose. Pilote l'entree du plan. */
  entrance?: number
  /** Frame du plan, pour la respiration. */
  frame: number
  opacity?: number
}> = ({ height, bottom, centerX, voiceFrame, voice, entrance = 1, frame, opacity = 1 }) => {
  const width = (MASCOT.w / MASCOT.h) * height
  const src = staticFile('mascot/lion.webp')

  /** Le niveau de la voix a cette frame. 0 quand il se tait. */
  const level = voiceFrame === undefined || !voice ? 0 : (voice[voiceFrame] ?? 0)

  /*
   * La respiration : une montee-descente lente, independante de la voix.
   * Sans elle, un personnage qui accentue entre deux syllabes redevient une
   * image fixe — et c'est exactement ce qui fait « carton decoupe ».
   */
  const breathe = Math.sin((frame / 30) * Math.PI * 0.9) * 0.005

  /*
   * L'accent. Le lion se redresse sur les syllabes fortes : il grandit d'un
   * pour cent depuis ses pieds, ce qui monte les epaules et la tete sans
   * decoller le corps du bas du cadre.
   */
  const push = level * 0.013

  /*
   * La tete suit avec deux frames de retard.
   *
   * C'est tout le truc : un corps et une tete qui bougent exactement ensemble
   * font un bloc rigide, un decalage de deux frames fait une nuque. Le retard
   * est pris sur l'enveloppe elle-meme, donc il reste cale sur la voix.
   */
  const lag = voiceFrame === undefined || !voice ? 0 : (voice[voiceFrame - 2] ?? 0)
  const nod = (level - lag) * 10

  const inY = (1 - entrance) * height * 0.18

  /*
   * Le traitement — c'est lui qui fait que le lion appartient au film.
   *
   * Sorti du modele, c'est un rendu 3D brillant, satur&eacute;, eclaire en studio
   * neutre : pose tel quel sur le fond du film il se lit comme une image
   * collee, pas comme un plan. Trois couches le ramenent dans la palette, et
   * aucune ne retouche l'image source — tout est fait au rendu, donc tout
   * reste reglable.
   *
   *  - un **halo** decoupe a sa silhouette et floute, qui le detache du fond
   *    comme la lumiere de bord du reste du film ;
   *  - un **voile** de la couleur primaire en `soft-light`, qui tire les
   *    ombres vers le violet du theme au lieu du brun neutre du rendu ;
   *  - une **ombre de contact** au sol, sans laquelle un personnage detoure
   *    flotte toujours.
   *
   * Le grain du film passe par-dessus tout ca (`<Grain />` dans `Reel.tsx`),
   * et c'est la derniere chose qui unifie : le lion a desormais exactement le
   * meme grain que les captures et que les maillots.
   */
  const silhouette = {
    maskImage: `url(${src})`,
    WebkitMaskImage: `url(${src})`,
    maskSize: '100% 100%',
    WebkitMaskSize: '100% 100%',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
  } as const

  return (
    <div
      style={{
        position: 'absolute',
        left: centerX - width / 2,
        bottom,
        width,
        height,
        opacity: opacity * entrance,
        transform: `translateY(${inY - nod}px) scale(${1 + breathe + push})`,
        transformOrigin: '50% 100%',
      }}
    >
      {/* L'ombre de contact : une flaque sombre sous ses pieds. */}
      <div
        style={{
          position: 'absolute',
          left: -width * 0.1,
          bottom: -height * 0.03,
          width: width * 1.2,
          height: height * 0.12,
          background: `radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, transparent 70%)`,
          filter: 'blur(14px)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: C.primary,
          filter: 'blur(22px)',
          opacity: 0.42,
          ...silhouette,
        }}
      />

      <Img
        src={src}
        style={{
          position: 'relative',
          width,
          height,
          display: 'block',
          filter: 'saturate(0.88) contrast(1.05) brightness(0.97)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, ${C.primary}00 0%, ${C.primary} 100%)`,
          mixBlendMode: 'soft-light',
          opacity: 0.55,
          ...silhouette,
        }}
      />
    </div>
  )
}

/** L'entree du lion : il monte dans le cadre et se pose. */
export const mascotEntrance = (frame: number, at: number, len = 12) =>
  lerp(frame, [at, at + len], [0, 1], EASE.out)
