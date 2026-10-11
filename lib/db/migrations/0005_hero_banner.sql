-- La bannière d'accueil, réglable depuis l'admin.
--
-- Les colonnes naissent éteintes (`hero_enabled` à false) : une boutique en
-- service ne doit pas se réveiller avec un bandeau vide en haut de sa page
-- d'accueil si la migration passe avant que quiconque ait rempli le texte.
--
-- La ligne 1, elle, est allumée tout de suite avec la collection Sénégal, en
-- bas de ce fichier : c'est la bannière demandée, et une fonctionnalité livrée
-- éteinte n'est pas livrée. Tout est réglable dans /admin/réglages, décochage
-- compris.
--
-- Pas de `hero_image_url` : laissé vide, la bannière prend la photo du maillot
-- le plus récent de /selections — donc une des nôtres, et elle suit les
-- arrivages sans que personne y touche.
ALTER TABLE "settings" ADD COLUMN "hero_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "hero_title" varchar(80);--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "hero_subtitle" varchar(160);--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "hero_href" varchar(200);--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "hero_image_url" text;
--> statement-breakpoint
UPDATE "settings"
SET "hero_enabled" = true,
    "hero_title" = 'La collection Sénégal',
    "hero_subtitle" = 'Domicile, extérieur et rétro — payés à la livraison à Dakar.',
    "hero_href" = '/selections'
WHERE "id" = 1;
