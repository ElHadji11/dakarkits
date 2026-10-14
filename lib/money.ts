/**
 * Le pont entre les francs de la boutique et l'euro que Meta sait lire.
 *
 * Tout le reste du code compte en francs CFA, en entiers, et doit continuer de
 * le faire : c'est la monnaie dans laquelle le client paie, et un flottant n'a
 * rien à faire dans un prix. Mais **Meta ne connaît pas le XOF** — un événement
 * envoyé dans cette devise n'est pas valorisé, donc ni optimisation, ni ROAS,
 * ni valeur de conversion. Le compte publicitaire est en euros.
 *
 * La conversion n'existe donc qu'ici, au bord du système, et uniquement pour ce
 * qui part vers Meta : le Pixel du navigateur et l'API de conversions. Aucun
 * montant affiché, enregistré ou facturé ne passe par cette fonction.
 *
 * Le taux est la parité fixe de l'euro au franc CFA, pas un cours du jour :
 * 1 EUR = 655,957 XOF. Il ne bouge pas, donc rien à aller chercher en ligne, et
 * deux rapports du même achat — navigateur et serveur — tombent toujours sur le
 * même centime. C'est nécessaire : ils portent le même `event_id`, et deux
 * valeurs différentes pour un seul achat se lisent mal dans Events Manager.
 */

/** Parité fixe, fixée par traité. Ce n'est pas un cours, il ne se rafraîchit pas. */
export const CFA_PER_EUR = 655.957

/**
 * `13000` -> `19.82`. Arrondi au centime, parce qu'un montant à quinze
 * décimales dans un payload JSON n'apporte rien et fait douter de la mesure.
 */
export function eurFromCfa(francs: number): number {
  return Math.round((francs / CFA_PER_EUR) * 100) / 100
}
