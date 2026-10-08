-- Added in three steps rather than one NOT NULL column, so the migration also
-- works on a table that already holds orders.
ALTER TABLE "orders" ADD COLUMN "public_token" varchar(32);--> statement-breakpoint
UPDATE "orders" SET "public_token" = md5(random()::text || id::text) WHERE "public_token" IS NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "public_token" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_public_token_unique" UNIQUE("public_token");
