import type { Metadata } from 'next'
import Link from 'next/link'

import {
  A,
  LegalArticle,
  LegalIdentity,
  P,
  Section,
  Strong,
} from '@/components/shop/legal-text'

/**
 * Politique de confidentialité.
 *
 * Rédigée à partir d'un audit du code, pas d'un modèle : chaque pratique
 * décrite ici correspond à quelque chose que l'application fait réellement.
 * Si tu modifies la collecte, les destinataires ou la conservation, cette page
 * doit bouger en même temps. Les points sensibles, avec leur source :
 *
 *   - IP stockées en clair comme clé de `rate_limits` (lib/rate-limit.ts)
 *   - IP transmises en clair à Meta (lib/meta.ts, `client_ip_address`)
 *   - téléphone haché SHA-256 avant envoi à Meta (lib/meta.ts, `hashPhone`)
 *   - aucune suppression automatisée : il n'existe aucun `delete(orders)`
 *   - aucune purge de `rate_limits` hors connexion admin réussie
 *   - vue de page envoyée à Vercel Web Analytics depuis les deux groupes de
 *     routes publics (`<Analytics />` dans (shop)/layout.tsx et
 *     (checkout)/layout.tsx, jamais dans /admin) : chemin visité, référent,
 *     géolocalisation déduite, appareil, système, navigateur. Pas de `beforeSend`,
 *     donc le chemin part tel quel — y compris le jeton de la page de
 *     confirmation (app/(checkout)/commande/confirmee/[token]).
 */

const UPDATED = '15 octobre 2026'

export const metadata: Metadata = {
  title: 'Confidentialité',
  description:
    'Ce que DakarKits collecte, à qui nous le transmettons, combien de temps nous le gardons et comment nous contacter.',
  alternates: { canonical: '/confidentialite' },
}

export default function PrivacyPage() {
  return (
    <LegalArticle title="Politique de confidentialité" updated={UPDATED}>
      <Section title="Qui est responsable">
        <LegalIdentity />
        <P>
          Le traitement de tes données est soumis à la loi sénégalaise n° 2008-12 du 25 janvier
          2008 sur la protection des données à caractère personnel.
        </P>
      </Section>

      <Section title="Ce que nous collectons, et pourquoi">
        <P>
          <Strong>Pour te livrer :</Strong> ton nom, ton numéro de téléphone et ton adresse de
          livraison. Ce sont les trois seuls champs du formulaire de commande. Nous ne créons pas de
          compte et ne demandons jamais de données bancaires — tu paies au livreur, par Wave sur le
          +221 77 435 46 88, par Orange Money ou en espèces.
        </P>
        <P>
          <Strong>Pour savoir quelle publicité fonctionne :</Strong> si tu arrives par une annonce,
          nous conservons les paramètres présents dans le lien (<code className="text-xs">utm_source</code>,{' '}
          <code className="text-xs">utm_campaign</code>,{' '}
          <code className="text-xs">utm_content</code>, <code className="text-xs">fbclid</code>) et
          nous les enregistrons sur ta commande. Cela nous sert à arrêter les publicités qui ne
          vendent rien.
        </P>
        <P>
          <Strong>Pour empêcher les fausses commandes :</Strong> ton adresse IP est enregistrée pour
          compter les envois répétés et bloquer les robots. Elle est conservée en clair dans un
          compteur technique.
        </P>
        <P>
          Nous enregistrons aussi le contenu de ta commande : maillots, tailles, quantités, montants
          et date.
        </P>
      </Section>

      <Section title="Ce qui ne sort pas de ton téléphone">
        <P>
          Ton panier et tes favoris sont enregistrés dans la mémoire locale de ton navigateur
          (<code className="text-xs">localStorage</code>). Ils ne nous sont pas envoyés tant que tu
          ne valides pas une commande. Le panier ne contient d&apos;ailleurs aucun prix : seulement
          des identifiants de maillot, des tailles et des quantités.
        </P>
        <P>
          Les paramètres publicitaires de ta visite sont gardés dans la mémoire de session
          (<code className="text-xs">sessionStorage</code>) et disparaissent à la fermeture de
          l&apos;onglet, sauf si tu commandes.
        </P>
        <P>
          Vider les données de ton navigateur efface tout cela, sans effet sur les commandes déjà
          passées.
        </P>
      </Section>

      <Section title="À qui nous le transmettons">
        <P>
          Nous ne vendons ni ne louons tes données. Elles ne sont transmises qu&apos;aux
          prestataires qui font fonctionner la boutique, et seulement pour cela.
        </P>
        <P>
          Dès qu&apos;une commande est enregistrée, <Strong>ton nom, ton téléphone et ton
          adresse</Strong> sont acheminés jusqu&apos;à nous par notre prestataire d&apos;envoi
          d&apos;emails et par notre service de messagerie instantanée. Ta commande est conservée
          chez notre hébergeur de base de données, et les pages du site sont servies par notre
          hébergeur web. Le prestataire qui héberge les photos des maillots ne reçoit, lui, aucune
          donnée de client.
        </P>
        <P>
          <Strong>Pour compter les visites :</Strong> chaque page que tu ouvres est signalée à
          Vercel Web Analytics, la mesure d&apos;audience de notre hébergeur web. Partent avec :
          l&apos;adresse de la page visitée, la page qui t&apos;y a amené, le pays, la région et
          la ville déduits de ta connexion, le type d&apos;appareil, le système et le navigateur.{' '}
          <Strong>Ni ton nom, ni ton téléphone, ni ton adresse de livraison.</Strong> Si tu arrives
          par une annonce, les paramètres publicitaires font partie de l&apos;adresse et partent
          donc avec elle ; il en va de même de la clé de ta page de confirmation. Cette mesure ne
          tourne que sur la boutique et le formulaire de commande.
        </P>
        <P>
          Lorsque la publicité est active, nous signalons tes achats à notre régie publicitaire pour
          mesurer nos annonces. Ton numéro de téléphone part{' '}
          <Strong>haché en SHA-256</Strong>, jamais en clair. En revanche, ton adresse IP,
          l&apos;identifiant de ton navigateur et les cookies publicitaires déposés sur ton appareil
          lui sont transmis tels quels, comme le prévoit son interface.
        </P>
        <P>
          Nos livreurs reçoivent ton nom, ton téléphone et ton adresse, le temps de la livraison.
        </P>
        <P>
          Nous pouvons te communiquer le nom de ces prestataires sur demande, à{' '}
          <A href="mailto:contact@louyomb.com">contact@louyomb.com</A>.
        </P>
      </Section>

      <Section title="Cookies et traceurs">
        <P>
          Ce site ne dépose pas de cookie publicitaire de lui-même. Lorsque la publicité Meta est
          active, le Pixel Meta est chargé et dépose ses propres cookies depuis ton navigateur. Il
          se charge sans te demander ton accord au préalable : si tu ne le souhaites pas, bloque les
          cookies tiers dans les réglages de ton navigateur ou utilise un bloqueur. Le site continue
          de fonctionner normalement, commande comprise.
        </P>
        <P>
          Notre mesure d&apos;audience, elle, ne dépose aucun cookie et n&apos;écrit aucun
          identifiant durable sur ton appareil. Elle distingue les visites par un calcul fait sur la
          requête, sans rien laisser chez toi : rien à bloquer, rien à accepter.
        </P>
        <P>
          Le seul cookie que nous posons nous-mêmes est celui de la session d&apos;administration de
          la boutique. Il ne concerne pas les clients.
        </P>
      </Section>

      <Section title="Combien de temps nous gardons tes données">
        <P>
          Les commandes et les coordonnées qu&apos;elles contiennent sont conservées{' '}
          <Strong>trois ans</Strong> à compter de ta dernière commande, pour le service après-vente
          et notre comptabilité.
        </P>
        <P>
          Les compteurs anti-fraude contenant les adresses IP n&apos;ont pas aujourd&apos;hui de
          suppression automatique. Ils sont effacés lors de nos opérations de maintenance.
        </P>
        <P>
          Côté mesure d&apos;audience, le calcul qui distingue les visites est jeté au bout de{' '}
          <Strong>24 heures</Strong>. Ne restent ensuite que des totaux par page, par pays et par
          appareil, où plus rien ne te désigne.
        </P>
      </Section>

      <Section title="Comment c'est protégé">
        <P>
          Les échanges avec le site sont chiffrés (HTTPS). Toutes les données envoyées par un
          formulaire sont validées côté serveur avant d&apos;être enregistrées. Les montants ne sont
          jamais calculés par ton navigateur : le serveur les recalcule seul à la commande.
        </P>
        <P>
          Ta page de confirmation est protégée par une clé imprévisible plutôt que par ton numéro de
          commande : personne ne peut deviner l&apos;adresse de la commande d&apos;un autre client.
          L&apos;accès à l&apos;administration est protégé par mot de passe haché, session signée et
          limitation des tentatives.
        </P>
        <P>Aucun système n&apos;est infaillible : nous ne pouvons pas garantir une sécurité absolue.</P>
      </Section>

      <Section title="Tes droits">
        <P>
          Tu peux demander à consulter, corriger ou supprimer les données que nous avons sur toi, et
          t&apos;opposer à leur traitement. Écris à{' '}
          <A href="mailto:contact@louyomb.com">contact@louyomb.com</A> ou appelle la boutique.
        </P>
        <P>
          Pour être transparents : il n&apos;existe pas de bouton pour cela sur le site. Nous
          traitons ces demandes à la main, sous <Strong>30 jours</Strong>. Nous pouvons te demander
          ton numéro de commande pour vérifier que la demande vient bien de toi.
        </P>
        <P>
          Certaines données doivent être conservées malgré une demande de suppression, lorsque la
          loi comptable l&apos;impose.
        </P>
      </Section>

      <Section title="Enfants">
        <P>
          Cette boutique s&apos;adresse à des personnes majeures. Nous ne collectons pas sciemment
          les données d&apos;un mineur. Si cela s&apos;est produit, écris-nous et nous les
          supprimerons.
        </P>
      </Section>

      <Section title="Modifications">
        <P>
          Nous pouvons modifier cette politique. La date en haut de page indique la dernière
          révision. En cas de changement important dans ce que nous collectons, nous le signalerons
          sur le site.
        </P>
      </Section>

      <Section title="Nous contacter">
        <P>
          <A href="mailto:contact@louyomb.com">contact@louyomb.com</A>, ou les coordonnées en bas de
          chaque page. Voir aussi nos{' '}
          <Link href="/cgv" className="underline underline-offset-4 hover:text-foreground">
            conditions générales de vente
          </Link>
          .
        </P>
      </Section>
    </LegalArticle>
  )
}
