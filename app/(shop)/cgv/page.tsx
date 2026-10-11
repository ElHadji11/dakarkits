import type { Metadata } from 'next'
import Link from 'next/link'

import {
  A,
  LegalArticle,
  LegalIdentity,
  Li,
  List,
  P,
  Section,
  Strong,
} from '@/components/shop/legal-text'

/**
 * Conditions générales de vente.
 *
 * Écrites à partir de ce que l'application fait, pas d'un modèle. Chaque
 * engagement ci-dessous correspond à un comportement réel du code :
 *
 *   - trois champs, aucun compte client    app/(shop)/commande/_actions/order.ts
 *   - montants recalculés côté serveur     lib/pricing.ts
 *   - pack et livraison pris aux réglages  lib/settings.ts
 *   - trois statuts, motif d'annulation    lib/db/schema.ts (orderStatusEnum)
 *   - prix et titre figés sur la ligne     order.ts, insert dans orderItems
 *   - limites de débit et anti-doublon     order.ts (PER_IP, PER_PHONE, 10 min)
 *
 * Ne pas y écrire un droit, un frais ou un délai que le produit ne sait pas
 * tenir : c'est tout l'intérêt d'avoir audité le code avant de rédiger.
 */

const UPDATED = '11 octobre 2026'

export const metadata: Metadata = {
  title: 'Conditions générales de vente',
  description:
    'Les règles de vente de DakarKits : produits, prix, commande, paiement à la livraison, vérification à la réception, annulation.',
  alternates: { canonical: '/cgv' },
}

export default function TermsPage() {
  return (
    <LegalArticle title="Conditions générales de vente" updated={UPDATED}>
      <Section title="1. Objet et acceptation">
        <P>
          Ces conditions régissent toute vente conclue sur ce site. En confirmant une commande, tu
          les acceptes. Si tu n&apos;en acceptes pas une partie, ne commande pas.
        </P>
        <P>
          Elles s&apos;adressent à des personnes majeures, capables de contracter, qui commandent
          pour leur usage personnel et se font livrer à Dakar.
        </P>
      </Section>

      <Section title="2. Le vendeur">
        <LegalIdentity />
      </Section>

      <Section title="3. Les maillots que nous vendons">
        <P>
          <Strong>
            Les maillots vendus sur ce site ne sont pas des produits officiels sous licence.
          </Strong>{' '}
          Ils ne sont ni fabriqués, ni distribués, ni autorisés par les clubs, les fédérations ou
          les équipementiers dont ils reprennent les couleurs et les motifs.
        </P>
        <P>
          DakarKits n&apos;est affilié à aucun d&apos;eux, ni associé ou lié à eux de quelque manière
          que ce soit. Les noms et logos qui peuvent apparaître appartiennent à leurs titulaires
          respectifs et servent uniquement à décrire l&apos;équipe à laquelle un maillot fait
          référence.
        </P>
        <P>
          Aucune de nos descriptions n&apos;emploie les mots « officiel » ou « authentique ». Les
          photos que nous publions sont les nôtres, prises sur les articles que nous vendons
          réellement, et non des visuels de catalogue. De légères différences de teinte ou de
          finition entre la photo et l&apos;article restent possibles.
        </P>
      </Section>

      <Section title="4. Prix">
        <P>
          Les prix sont affichés en francs CFA (XOF), en nombres entiers, toutes taxes comprises le
          cas échéant. Un prix barré, lorsqu&apos;il est affiché, est un prix de référence antérieur
          et non celui d&apos;un concurrent.
        </P>
        <P>
          <Strong>Le serveur calcule seul tous les montants</Strong> au moment de la commande, à
          partir des prix en base. Rien de ce que ton navigateur envoie comme total n&apos;est pris
          en compte. Si un prix a changé entre le moment où tu as rempli ton panier et celui où tu
          valides, c&apos;est le prix recalculé qui s&apos;applique, et il t&apos;est présenté sur la
          page de confirmation avant tout paiement.
        </P>
        <P>
          Une offre groupée (« pack ») peut être active : un barème de prix globaux, un par nombre
          de maillots. Le serveur retient de lui-même la combinaison la moins chère pour toi, et
          n&apos;applique jamais un palier qui coûterait plus que la somme des prix affichés. Les
          maillots exclus du pack n&apos;y entrent pas. L&apos;activation du pack, ses paliers et
          leurs prix sont susceptibles de changer à tout moment ; seuls les montants affichés au
          moment de ta commande t&apos;engagent.
        </P>
        <P>
          Les frais de livraison sont soit ajoutés au total, soit inclus dans les prix affichés. Le
          récapitulatif de commande indique toujours le sous-total, la remise éventuelle, la
          livraison et le total à payer.
        </P>
      </Section>

      <Section title="5. Passer commande">
        <P>
          La commande ne demande ni compte ni inscription : trois champs seulement — nom, numéro de
          téléphone et adresse de livraison. Le numéro doit être un numéro sénégalais à neuf
          chiffres commençant par 7.
        </P>
        <P>
          À la validation, nous vérifions de nouveau que chaque maillot est en vente, que la taille
          choisie est disponible, puis nous créons la commande et t&apos;affichons un numéro de la
          forme <code className="text-xs">DK-00042</code>. Cette page de confirmation vaut
          récapitulatif. Elle est accessible par un lien privé : conserve-le.
        </P>
        <P>
          <Strong>La commande ne constitue pas une vente ferme à elle seule.</Strong> Nous te
          contactons par téléphone pour la confirmer et convenir de la livraison. Nous pouvons
          refuser ou annuler une commande, notamment si un article n&apos;est plus disponible, si les
          coordonnées sont manifestement erronées ou injoignables, ou en cas de soupçon de fraude.
        </P>
        <P>
          Le prix et l&apos;intitulé de chaque ligne sont figés au moment de la commande : une
          modification ultérieure du catalogue ne change jamais une commande déjà passée.
        </P>
      </Section>

      <Section title="6. Disponibilité et tailles">
        <P>
          Un maillot peut être proposé sans choix de taille, avec une sélection de tailles, ou
          affiché comme épuisé lorsque aucune taille n&apos;est disponible. Une taille non cochée
          n&apos;est pas commandable.
        </P>
        <P>
          Le catalogue est servi depuis un cache pour rester rapide : il peut, pendant un court
          instant, afficher un article qui vient d&apos;être épuisé. La vérification faite au moment
          de la commande fait foi. Si un article devient indisponible après ta commande, nous te
          prévenons et annulons la ligne concernée sans frais.
        </P>
      </Section>

      <Section title="7. Paiement à la livraison">
        <P>
          Le paiement se fait <Strong>au livreur, au moment de la remise</Strong> : par Wave sur
          le <Strong>+221 77 435 46 88</Strong>, par Orange Money, ou en espèces. Ce site ne
          collecte aucune donnée bancaire et ne prélève rien à l&apos;avance.
        </P>
        <P>
          Prévois le montant exact affiché sur ta confirmation. Le transfert de propriété
          s&apos;opère au paiement intégral.
        </P>
      </Section>

      <Section title="8. Livraison">
        <P>
          Nous livrons <Strong>uniquement à Dakar</Strong>, sous 24 à 48 heures après confirmation
          téléphonique, hors week-ends, jours fériés et cas de force majeure. Ce délai est indicatif
          et un retard n&apos;ouvre pas droit à indemnité.
        </P>
        <P>
          Tu dois être joignable au numéro indiqué et présent à l&apos;adresse convenue. Si la
          livraison échoue parce que tu es injoignable ou absent, nous pouvons la représenter ou
          annuler la commande. Des représentations répétées peuvent nous conduire à refuser tes
          commandes suivantes.
        </P>
      </Section>

      <Section title="9. Vérification à la réception, refus et retours">
        <P>
          <Strong>
            Ouvre et vérifie le colis devant le livreur, avant de payer. C&apos;est le moment prévu
            pour contrôler le modèle, la taille et l&apos;état.
          </Strong>
        </P>
        <P>
          À cet instant, tu peux refuser tout ou partie de la commande, sans frais et sans
          justification : tu ne paies rien et l&apos;article repart avec le livreur.
        </P>
        <P>
          <Strong>
            Une fois le colis payé et accepté, la vente est ferme : nous ne reprenons ni
            n&apos;échangeons un article pour un changement d&apos;avis ou une erreur de taille.
          </Strong>{' '}
          Cette règle est la contrepartie du paiement à la livraison, qui te donne la possibilité
          d&apos;inspecter avant de payer.
        </P>
        <P>
          Restent dus les recours légaux en cas de défaut caché ou de non-conformité à ce qui a été
          commandé. Signale-le-nous <Strong>sous 48 heures</Strong> à{' '}
          <A href="mailto:contact@louyomb.com">contact@louyomb.com</A>, photos à l&apos;appui ; nous
          procédons alors au remplacement ou au remboursement.
        </P>
      </Section>

      <Section title="10. Annulation">
        <P>
          Tu peux annuler une commande sans frais tant qu&apos;elle n&apos;a pas été livrée :
          appelle-nous ou écris-nous avec ton numéro de commande.
        </P>
        <P>
          Nous pouvons également annuler une commande, pour les motifs listés à l&apos;article 5. Une
          commande annulée porte le motif de son annulation.
        </P>
      </Section>

      <Section title="11. Usage du site">
        <P>En utilisant ce site, tu t&apos;engages à ne pas :</P>
        <List>
          <Li>passer de commandes que tu n&apos;as pas l&apos;intention d&apos;honorer ;</Li>
          <Li>
            utiliser de nom, numéro ou adresse qui ne sont pas les tiens ou que tu n&apos;es pas
            autorisé à utiliser ;
          </Li>
          <Li>
            automatiser l&apos;envoi de commandes, ni tenter de contourner les protections
            anti-fraude du formulaire ;
          </Li>
          <Li>
            tenter d&apos;accéder à l&apos;administration de la boutique ou à la commande
            d&apos;un autre client ;
          </Li>
          <Li>revendre notre catalogue, nos photos ou nos textes.</Li>
        </List>
        <P>
          Le site limite le nombre de commandes par adresse IP et par numéro de téléphone sur une
          courte période, et regroupe en une seule les commandes identiques envoyées à quelques
          minutes d&apos;intervalle. Nous pouvons refuser le service à qui ne respecte pas ces
          règles.
        </P>
      </Section>

      <Section title="12. Propriété intellectuelle">
        <P>
          La structure du site, ses textes et les photographies des produits que nous réalisons
          nous appartiennent. Tu ne peux pas les reproduire sans autorisation écrite. Cela ne
          s&apos;étend pas aux marques et logos de tiers mentionnés à l&apos;article 3, qui
          appartiennent à leurs titulaires.
        </P>
      </Section>

      <Section title="13. Services tiers">
        <P>
          Ce site s&apos;appuie sur des prestataires d&apos;hébergement, d&apos;images, d&apos;email,
          de messagerie et de mesure publicitaire. Ils sont listés dans notre{' '}
          <Link href="/confidentialite" className="underline underline-offset-4 hover:text-foreground">
            politique de confidentialité
          </Link>
          . Leurs propres conditions s&apos;appliquent à leur part du service et nous ne répondons
          pas de leurs interruptions.
        </P>
      </Section>

      <Section title="14. Disponibilité du site et responsabilité">
        <P>
          Le site est fourni « en l&apos;état ». Nous ne garantissons ni un fonctionnement
          ininterrompu, ni l&apos;absence d&apos;erreur, et nous pouvons le suspendre ou le modifier
          à tout moment.
        </P>
        <P>
          Nous mettons tout en œuvre pour que les descriptions, prix et disponibilités soient
          exacts ; des erreurs restent possibles. Une erreur manifeste de prix ne nous engage pas :
          nous te prévenons et tu es libre d&apos;annuler.
        </P>
        <P>
          Dans la limite permise par la loi, notre responsabilité au titre d&apos;une commande est
          plafonnée au montant que tu as effectivement payé pour celle-ci. Nous ne répondons pas des
          dommages indirects. Rien ici n&apos;écarte une responsabilité qui ne peut légalement
          l&apos;être.
        </P>
      </Section>

      <Section title="15. Données personnelles">
        <P>
          Le traitement de tes données est décrit dans notre{' '}
          <Link href="/confidentialite" className="underline underline-offset-4 hover:text-foreground">
            politique de confidentialité
          </Link>
          , qui fait partie intégrante de ces conditions.
        </P>
      </Section>

      <Section title="16. Modification des conditions">
        <P>
          Nous pouvons modifier ces conditions. La version applicable à ta commande est celle en
          ligne au moment où tu la valides. La date en haut de page indique la dernière révision.
        </P>
      </Section>

      <Section title="17. Droit applicable et litiges">
        <P>
          Ces conditions sont régies par le droit sénégalais. En cas de différend, cherchons
          d&apos;abord une solution amiable : écris-nous à{' '}
          <A href="mailto:contact@louyomb.com">contact@louyomb.com</A>. À défaut d&apos;accord, les
          tribunaux compétents de Dakar sont seuls saisis.
        </P>
      </Section>
    </LegalArticle>
  )
}
