-- Le pack passe d'un seul palier (`pack_size` / `pack_price`) à un barème :
-- un prix par nombre de maillots. Deux maillots à 13 000 F laissaient le
-- troisième à son prix plein, soit 21 000 F les trois — 7 000 F le maillot
-- contre 6 500 F dans la paire. Le troisième coûtait plus cher que les deux
-- premiers, ce que personne ne comprend.
CREATE TABLE "pack_tiers" (
	"size" integer PRIMARY KEY NOT NULL,
	"price" integer NOT NULL
);
--> statement-breakpoint
-- Le pack en service devient le premier palier, tel quel. Rien ne change de
-- prix pour qui commandait déjà deux maillots.
INSERT INTO "pack_tiers" ("size", "price")
SELECT "pack_size", "pack_price"
FROM "settings"
WHERE "id" = 1 AND "pack_size" >= 2 AND "pack_price" > 0;
--> statement-breakpoint
-- Et le palier suivant au même tarif au maillot : 13 000 × 3 / 2 = 19 500 F
-- les trois. Calculé depuis la ligne plutôt qu'écrit en dur, pour que la
-- migration tienne quel que soit le prix réellement en base. Division entière
-- en Postgres, donc pas de flottant.
INSERT INTO "pack_tiers" ("size", "price")
SELECT "pack_size" + 1, ("pack_price" * ("pack_size" + 1)) / "pack_size"
FROM "settings"
WHERE "id" = 1 AND "pack_size" >= 2 AND "pack_price" > 0
ON CONFLICT ("size") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "pack_size";--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "pack_price";
