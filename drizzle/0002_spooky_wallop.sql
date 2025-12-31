ALTER TABLE "email_drafts" ADD COLUMN "regeneration_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "email_drafts" ADD COLUMN "current_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "email_drafts" ADD COLUMN "draft_versions" jsonb;