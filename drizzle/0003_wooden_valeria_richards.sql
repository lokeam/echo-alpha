ALTER TABLE "email_drafts" ADD COLUMN "last_regeneration_at" timestamp;--> statement-breakpoint
ALTER TABLE "spaces" ADD COLUMN "detailed_amenities" jsonb;