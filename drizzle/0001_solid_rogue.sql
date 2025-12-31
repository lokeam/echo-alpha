CREATE TABLE "email_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" integer NOT NULL,
	"inbound_email_id" integer NOT NULL,
	"ai_generated_body" text NOT NULL,
	"edited_body" text,
	"final_body" text,
	"confidence_score" integer NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"reasoning" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by" varchar(255),
	"sent_at" timestamp,
	"sent_email_id" integer
);
--> statement-breakpoint
ALTER TABLE "email_drafts" ADD CONSTRAINT "email_drafts_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_drafts" ADD CONSTRAINT "email_drafts_inbound_email_id_emails_id_fk" FOREIGN KEY ("inbound_email_id") REFERENCES "public"."emails"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_drafts" ADD CONSTRAINT "email_drafts_sent_email_id_emails_id_fk" FOREIGN KEY ("sent_email_id") REFERENCES "public"."emails"("id") ON DELETE no action ON UPDATE no action;