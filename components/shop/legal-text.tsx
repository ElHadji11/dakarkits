/**
 * Typographie partagée par les deux pages juridiques (confidentialité et CGV).
 *
 * Du texte long se lit mal en `muted-foreground` : le corps est en
 * `foreground/80`, soit environ 9:1 sur le fond du site, contre 6,7:1 pour
 * `muted-foreground`.
 */

export function LegalArticle({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: React.ReactNode
}) {
  return (
    <article className="mx-auto max-w-prose space-y-8 py-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">Dernière mise à jour : {updated}</p>
      </header>
      {children}
    </article>
  )
}

/**
 * Identification du vendeur, source unique pour les CGV et la politique de
 * confidentialité : les deux pages doivent dire exactement la même chose.
 *
 * Relevé sur l'avis d'immatriculation ANSD du 12/11/2025 et le formulaire
 * RCCM du 11/11/2025. **Entreprise individuelle, pas une société** : il n'y a
 * pas de personne morale distincte, l'exploitant contracte en son nom propre.
 *
 * Le téléphone est écrit ici plutôt que lu dans `settings` : c'est le numéro
 * porté par l'immatriculation, pas celui que l'admin peut changer pour
 * l'affichage.
 */
export function LegalIdentity() {
  return (
    <>
      <P>
        DakarKits est un nom commercial de l&apos;entreprise individuelle{' '}
        <Strong>THIOR Elhadji Babacar</Strong> (enseigne EL HAAJI NDANANE TECH), immatriculée au
        registre du commerce et du crédit mobilier de Dakar sous le numéro{' '}
        <Strong>SN.DKR.2025.A.43110</Strong> et identifiée par le NINEA{' '}
        <Strong>012582377</Strong>, dont l&apos;établissement est sis Hann Mariste 2/D, Villa n° 53,
        Îlot P, Dakar, Sénégal.
      </P>
      <P>
        Téléphone <A href="tel:+221774354688">+221 77 435 46 88</A> · courriel{' '}
        <A href="mailto:contact@louyomb.com">contact@louyomb.com</A>.
      </P>
    </>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">{title}</h2>
      {children}
    </section>
  )
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-foreground/80">{children}</p>
}

export function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-medium text-foreground">{children}</strong>
}

export function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="underline underline-offset-4 hover:text-foreground">
      {children}
    </a>
  )
}

export function List({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-3 text-sm leading-relaxed text-foreground/80">{children}</ul>
}

export function Li({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <li>
      {label ? (
        <>
          <Strong>{label}</Strong> —{' '}
        </>
      ) : null}
      {children}
    </li>
  )
}
