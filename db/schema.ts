import { pgTable, serial, text, integer, jsonb, timestamp, varchar, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const deals = pgTable('deals', {
  id: serial('id').primaryKey(),
  seekerName: varchar('seeker_name', { length: 255 }).notNull(),
  seekerEmail: varchar('seeker_email', { length: 255 }).notNull(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  teamSize: integer('team_size').notNull(),
  monthlyBudget: integer('monthly_budget').notNull(),
  requirements: jsonb('requirements').notNull().$type<{
    dogFriendly?: boolean;
    parking?: boolean;
    afterHours?: boolean;
    location?: string;
  }>(),
  stage: varchar('stage', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const spaces = pgTable('spaces', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address').notNull(),
  neighborhood: varchar('neighborhood', { length: 100 }),
  hostCompany: varchar('host_company', { length: 255 }).notNull(),
  hostEmail: varchar('host_email', { length: 255 }).notNull(),
  hostContext: text('host_context'),
  amenities: jsonb('amenities').notNull().$type<{
    parking?: boolean;
    dogFriendly?: boolean;
    afterHours?: boolean;
    [key: string]: boolean | undefined;
  }>(),
  availability: jsonb('availability').notNull().$type<{
    tuesday?: string[];
    wednesday?: string[];
    [key: string]: string[] | undefined;
  }>(),
  monthlyRate: integer('monthly_rate').notNull(),
  detailedAmenities: jsonb('detailed_amenities').$type<{
    parking?: {
      type?: string;
      location?: string;
      costMonthly?: number;
      costPerDay?: number;
      spotsAvailable?: number;
      provider?: string;
      sharedSpots?: boolean;
      note?: string;
    };
    dogPolicy?: {
      allowed: boolean;
      reason?: string;
      flexibility?: string;
      alternative?: string;
      sizeLimit?: string;
      deposit?: number;
      note?: string;
    };
    access?: {
      system?: string;
      costPerCard?: number;
      cost?: number;
      process?: string;
      hours?: string;
      afterHours?: boolean;
      advanceNotice?: string;
      securityContact?: string;
    };
    meetingRooms?: {
      count: number;
      sizes: number[];
      bookingSystem?: string;
      maxHoursPerBooking?: number;
      note?: string;
    };
    rentInclusions?: {
      utilities?: boolean;
      internet?: string;
      janitorial?: string;
      hvac?: boolean;
      kitchen?: string;
    };
    hostStatus?: string;
    lastContact?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const emails = pgTable('emails', {
  id: serial('id').primaryKey(),
  dealId: integer('deal_id').references(() => deals.id).notNull(),
  from: varchar('from', { length: 255 }).notNull(),
  to: varchar('to', { length: 255 }).notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  aiGenerated: boolean('ai_generated').default(false),
  aiMetadata: jsonb('ai_metadata').$type<{
    confidence?: number;
    reasoning?: {
      schedulingLogic?: string[];
      dataLookups?: Array<{
        question: string;
        source: string;
        answer: string;
      }>;
      needsHumanReview?: string[];
    };
    suggestedActions?: string[];
    timeSaved?: {
      traditional: number;
      withAI: number;
    };
  }>(),
});

export const dealSpaces = pgTable('deal_spaces', {
  id: serial('id').primaryKey(),
  dealId: integer('deal_id').references(() => deals.id).notNull(),
  spaceId: integer('space_id').references(() => spaces.id).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const emailDrafts = pgTable('email_drafts', {
  id: serial('id').primaryKey(),
  dealId: integer('deal_id').references(() => deals.id).notNull(),
  inboundEmailId: integer('inbound_email_id').references(() => emails.id).notNull(),
  aiGeneratedBody: text('ai_generated_body').notNull(),
  editedBody: text('edited_body'),
  finalBody: text('final_body'),
  confidenceScore: integer('confidence_score').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  reasoning: jsonb('reasoning').$type<{
    questionsAddressed: Array<{
      question: string;
      answer: string;
      sourceEmailId?: number;
      sourceText?: string;
    }>;
    dataUsed: Array<{
      dataPoint: string;
      sourceType?: 'space' | 'deal' | 'email';
      sourceId?: number;
      fieldPath?: string;
      value?: any;
    }>;
    schedulingLogic?: string[];
  }>(),
  metadata: jsonb('metadata').$type<{
    model: string;
    tokensUsed: number;
    generatedAt: Date;
    validationTokensUsed?: number;
  }>(),
  validation: jsonb('validation').$type<{
    status: 'passed' | 'warnings' | 'failed';
    issues: string[];
    checkedAt: Date;
  }>(),
  regenerationCount: integer('regeneration_count').notNull().default(0),
  lastRegenerationAt: timestamp('last_regeneration_at'),
  currentVersion: integer('current_version').notNull().default(0),
  draftVersions: jsonb('draft_versions').$type<Array<{
    version: number;
    body: string;
    prompt: string | null;
    confidence: number;
    reasoning: {
      questionsAddressed: Array<{
        question: string;
        answer: string;
        sourceEmailId?: number;
        sourceText?: string;
      }>;
      dataUsed: Array<{
        dataPoint: string;
        sourceType?: 'space' | 'deal' | 'email';
        sourceId?: number;
        fieldPath?: string;
        value?: any;
      }>;
      schedulingLogic?: string[];
    };
    metadata: {
      model: string;
      tokensUsed: number;
      generatedAt: Date;
    };
    createdAt: Date;
  }>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: varchar('reviewed_by', { length: 255 }),
  sentAt: timestamp('sent_at'),
  sentEmailId: integer('sent_email_id').references(() => emails.id),
  archivedAt: timestamp('archived_at'),
  archivedBy: varchar('archived_by', { length: 255 }),
  archiveReason: text('archive_reason'),
});

export const dealsRelations = relations(deals, ({ many }) => ({
  emails: many(emails),
  dealSpaces: many(dealSpaces),
}));

export const emailsRelations = relations(emails, ({ one }) => ({
  deal: one(deals, {
    fields: [emails.dealId],
    references: [deals.id],
  }),
}));

export const spacesRelations = relations(spaces, ({ many }) => ({
  dealSpaces: many(dealSpaces),
}));

export const dealSpacesRelations = relations(dealSpaces, ({ one }) => ({
  deal: one(deals, {
    fields: [dealSpaces.dealId],
    references: [deals.id],
  }),
  space: one(spaces, {
    fields: [dealSpaces.spaceId],
    references: [spaces.id],
  }),
}));

export const emailDraftsRelations = relations(emailDrafts, ({ one }) => ({
  deal: one(deals, {
    fields: [emailDrafts.dealId],
    references: [deals.id],
  }),
  inboundEmail: one(emails, {
    fields: [emailDrafts.inboundEmailId],
    references: [emails.id],
  }),
  sentEmail: one(emails, {
    fields: [emailDrafts.sentEmailId],
    references: [emails.id],
  }),
}));

export type Deal = typeof deals.$inferSelect;
export type Space = typeof spaces.$inferSelect;
export type Email = typeof emails.$inferSelect;
export type DealSpace = typeof dealSpaces.$inferSelect;
export type EmailDraft = typeof emailDrafts.$inferSelect;
