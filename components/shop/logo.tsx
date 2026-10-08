/**
 * Le monogramme DK, vectorisé depuis le logo d'origine.
 *
 * Contours relevés au sous-pixel sur l'image fournie puis simplifiés : vérifié
 * par rastérisation contre l'original, aucun pixel en désaccord franc. Trois
 * tracés fermés — le K, la diagonale et la barre basse du D, puis le fût et la
 * barre haute du D — réunis en un seul `path` avec `fill-rule: evenodd`.
 *
 * `currentColor` : le thème décide, jamais ce fichier. Et le SVG est en ligne
 * plutôt que dans `public/`, donc aucune requête de plus dans l'en-tête, qui
 * est sur le chemin du LCP de chaque page.
 */
export const LOGO_VIEWBOX = '0 0 320.36 192.6'
/** Largeur / hauteur du monogramme, pour le dimensionner sans le déformer. */
export const LOGO_RATIO = 320.36 / 192.6

export const LOGO_PATH =
  'M310.7 2.1L249.4 78.4L247.6 81.4L299.5 159.4L311.3 176.4L319.1 188.4L320.4 191.4L319.7 192.1L316.7 192.5L280.7 192.5L276.7 192L274.7 190.6L230.2 123.4L228.7 120.4L222.7 112.1L221.7 112.2L220.6 113.4L205.7 131.7L202.5 136.4L201.6 138.4L201.3 187.4L201.2 189.4L200.4 191.4L199.7 192L196.7 192.4L163.7 192.6L160.7 192.5L158.7 191.5L158 190.4L157.5 188.4L157.5 183.4L158.2 179.4L163.7 173.2L169.7 165.3L173.7 159.2L179 149.4L189.9 124.4L200.4 97.4L209.3 77.4L217.1 65.4L230.2 48.4L264.7 4.5L267.4 1.4L268.7 0.5L270.7 0.1L310.7 0.1L311.3 1.4ZM240.7 2.3L222.6 23.4L213.7 35.8L205.5 48.4L198.6 60.4L189.5 78.4L162.2 142.4L158.3 149.4L153 157.4L149.2 162.4L139.7 171.8L135.7 174.9L126.7 180.7L118.7 184.4L105.7 188.9L93.7 191L84.7 192.1L66.7 192.6L4.7 192.2L1.7 190.8L0.6 189.4L0.1 187.4L0 162.4L0.7 159.4L2.7 157.8L4.7 157.2L7.7 157.1L76.7 156.9L86.7 156.5L95.7 154.6L101.7 152.6L109.7 148.6L114.1 145.4L120.7 139.1L125.8 132.4L128 128.4L130.7 123.4L162.5 51.4L170.3 36.4L179.4 23.4L184 18.4L192.7 11.1L200.7 6.2L208.7 2.9L215.7 0.9L227.7 0.1L241.7 0L242.2 0.4ZM149.7 32.2L150.1 34.4L149.2 37.4L136.3 66.4L132.7 73.2L125.9 60.4L121.7 54.4L118.7 51L111.3 44.4L106.7 41.4L101.7 39.2L92.7 36.5L86.7 35.7L39.7 34.5L35.7 35.2L34.4 37.4L34.2 39.4L34.1 134.4L32.7 136.9L31.7 137.7L29.7 138.1L4.7 138L2.3 137.4L0.2 135.4L0.1 132.4L0 7.4L0.4 2.4L1.7 0.9L2.7 0.3L4.7 0.2L67.7 0.2L94.7 0.9L101.7 2L112.7 4.9L115.7 6.1L122.7 9.2L130.7 13.9L141.4 22.4L148.9 30.4Z'

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      fill="currentColor"
      fillRule="evenodd"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path d={LOGO_PATH} />
    </svg>
  )
}
