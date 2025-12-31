import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { emailDrafts, emails, deals } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { generateEmailDraft } from '../services/emailGenerator';
import { sendEmail } from '../services/emailSender';

export const draftRouter = router({
  /**
   * Create a new draft by generating AI email
   */
  create: publicProcedure
    .input(z.object({
      dealId: z.number().positive(),
      inboundEmailId: z.number().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { pool } = await import('../../db/index');

      // Fetch deal
      const dealResult = await ctx.db.query.deals.findFirst({
        where: eq(deals.id, input.dealId),
      });

      if (!dealResult) {
        throw new Error('Deal not found');
      }

      // Fetch spaces associated with this deal
      const spacesResult = await pool.query(
        `SELECT s.* FROM spaces s
         INNER JOIN deal_spaces ds ON s.id = ds.space_id
         WHERE ds.deal_id = $1`,
        [input.dealId]
      );

      // Fetch email thread
      const emailThreadResult = await pool.query(
        'SELECT * FROM emails WHERE deal_id = $1 ORDER BY sent_at ASC',
        [input.dealId]
      );

      // Fetch the specific inbound email
      const inboundEmailResult = await pool.query(
        'SELECT * FROM emails WHERE id = $1',
        [input.inboundEmailId]
      );

      if (inboundEmailResult.rows.length === 0) {
        throw new Error('Inbound email not found');
      }

      // Generate AI draft
      const aiDraft = await generateEmailDraft({
        deal: dealResult,
        spaces: spacesResult.rows,
        emailThread: emailThreadResult.rows,
        inboundEmail: inboundEmailResult.rows[0],
      });

      // Save draft to database
      const [savedDraft] = await ctx.db.insert(emailDrafts).values({
        dealId: input.dealId,
        inboundEmailId: input.inboundEmailId,
        aiGeneratedBody: aiDraft.body,
        finalBody: aiDraft.body,
        confidenceScore: aiDraft.confidence,
        status: 'pending',
        reasoning: aiDraft.reasoning,
        metadata: aiDraft.metadata,
      }).returning();

      return savedDraft;
    }),

  /**
   * List drafts with optional filters
   */
  list: publicProcedure
    .input(z.object({
      dealId: z.number().optional(),
      status: z.enum(['pending', 'approved', 'rejected', 'sent']).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const { pool } = await import('../../db/index');

      let query = `
        SELECT
          ed.*,
          d.company_name,
          d.seeker_name,
          e.from as inbound_from,
          e.subject as inbound_subject,
          e.sent_at as inbound_sent_at
        FROM email_drafts ed
        INNER JOIN deals d ON ed.deal_id = d.id
        INNER JOIN emails e ON ed.inbound_email_id = e.id
        WHERE 1=1
      `;

      const params: (number | string)[] = [];
      let paramIndex = 1;

      if (input.dealId) {
        query += ` AND ed.deal_id = $${paramIndex}`;
        params.push(input.dealId);
        paramIndex++;
      }

      if (input.status) {
        query += ` AND ed.status = $${paramIndex}`;
        params.push(input.status);
        paramIndex++;
      }

      // Order by confidence (low first for review priority) then by created_at
      query += ` ORDER BY ed.confidence_score ASC, ed.created_at DESC`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(input.limit, input.offset);

      const result = await pool.query(query, params);
      return result.rows;
    }),

  /**
   * Get a single draft by ID with full context
   */
  getById: publicProcedure
    .input(z.object({
      draftId: z.number().positive(),
    }))
    .query(async ({ ctx, input }) => {
      const { pool } = await import('../../db/index');

      const result = await pool.query(
        `SELECT
          ed.*,
          d.company_name,
          d.seeker_name,
          d.seeker_email,
          e.from as inbound_from,
          e.to as inbound_to,
          e.subject as inbound_subject,
          e.body as inbound_body,
          e.sent_at as inbound_sent_at
        FROM email_drafts ed
        INNER JOIN deals d ON ed.deal_id = d.id
        INNER JOIN emails e ON ed.inbound_email_id = e.id
        WHERE ed.id = $1`,
        [input.draftId]
      );

      if (result.rows.length === 0) {
        throw new Error('Draft not found');
      }

      return result.rows[0];
    }),

  /**
   * Update draft with human edits (works for pending and approved drafts)
   */
  update: publicProcedure
    .input(z.object({
      draftId: z.number().positive(),
      editedBody: z.string().min(10).max(10000),
    }))
    .mutation(async ({ ctx, input }) => {
      // First check if draft exists and is editable
      const existing = await ctx.db.query.emailDrafts.findFirst({
        where: eq(emailDrafts.id, input.draftId),
      });

      if (!existing) {
        throw new Error('Draft not found');
      }

      if (existing.status === 'sent') {
        throw new Error('Cannot edit a draft that has already been sent');
      }

      if (existing.status === 'rejected') {
        throw new Error('Cannot edit a rejected draft');
      }

      const [updated] = await ctx.db
        .update(emailDrafts)
        .set({
          editedBody: input.editedBody,
          finalBody: input.editedBody,
        })
        .where(eq(emailDrafts.id, input.draftId))
        .returning();

      return updated;
    }),

  /**
   * Approve a draft (marks as reviewed, ready to send)
   */
  approve: publicProcedure
    .input(z.object({
      draftId: z.number().positive(),
      finalBody: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updateData: {
        status: string;
        reviewedAt: Date;
        reviewedBy: string;
        finalBody?: string;
      } = {
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: 'Jenny', // Demo user
      };

      if (input.finalBody) {
        updateData.finalBody = input.finalBody;
      }

      const [updated] = await ctx.db
        .update(emailDrafts)
        .set(updateData)
        .where(eq(emailDrafts.id, input.draftId))
        .returning();

      if (!updated) {
        throw new Error('Draft not found');
      }

      return updated;
    }),

  /**
   * Send an approved draft via email
   */
  send: publicProcedure
    .input(z.object({
      draftId: z.number().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { pool } = await import('../../db/index');

      // Get draft with related data
      const draftResult = await pool.query(
        `SELECT
          ed.*,
          d.seeker_email,
          e.subject as inbound_subject
        FROM email_drafts ed
        INNER JOIN deals d ON ed.deal_id = d.id
        INNER JOIN emails e ON ed.inbound_email_id = e.id
        WHERE ed.id = $1`,
        [input.draftId]
      );

      if (draftResult.rows.length === 0) {
        throw new Error('Draft not found');
      }

      const draft = draftResult.rows[0];

      // Send email via Resend
      const sendResult = await sendEmail({
        to: 'lokeahnming@gmail.com', // Test email
        from: 'Alex from Tandem <onboarding@resend.dev>',
        subject: `Re: ${draft.inbound_subject}`,
        body: draft.final_body || draft.ai_generated_body,
        draftId: input.draftId,
      });

      if (!sendResult.success) {
        throw new Error(`Failed to send email: ${sendResult.error}`);
      }

      // Create email record
      const [sentEmail] = await ctx.db.insert(emails).values({
        dealId: draft.deal_id,
        from: 'agent@tandem.space',
        to: draft.seeker_email,
        subject: `Re: ${draft.inbound_subject}`,
        body: draft.final_body || draft.ai_generated_body,
        sentAt: sendResult.sentAt,
        aiGenerated: true,
        aiMetadata: {
          confidence: draft.confidence_score,
          reasoning: draft.reasoning as {
            schedulingLogic?: string[];
            dataLookups?: Array<{
              question: string;
              source: string;
              answer: string;
            }>;
            needsHumanReview?: string[];
          },
        },
      }).returning();

      // Update draft status
      const [updatedDraft] = await ctx.db
        .update(emailDrafts)
        .set({
          status: 'sent',
          sentAt: sendResult.sentAt,
          sentEmailId: sentEmail.id,
        })
        .where(eq(emailDrafts.id, input.draftId))
        .returning();

      return {
        draft: updatedDraft,
        email: sentEmail,
        messageId: sendResult.messageId,
      };
    }),

  /**
   * Reject a draft or unapprove an approved draft
   */
  reject: publicProcedure
    .input(z.object({
      draftId: z.number().positive(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check current status to determine action
      const existing = await ctx.db.query.emailDrafts.findFirst({
        where: eq(emailDrafts.id, input.draftId),
      });

      if (!existing) {
        throw new Error('Draft not found');
      }

      // If approved, unapprove it (set back to pending)
      // If pending, reject it
      const newStatus = existing.status === 'approved' ? 'pending' : 'rejected';

      const [updated] = await ctx.db
        .update(emailDrafts)
        .set({
          status: newStatus,
          reviewedAt: newStatus === 'rejected' ? new Date() : null,
          reviewedBy: newStatus === 'rejected' ? 'Jenny' : null,
        })
        .where(eq(emailDrafts.id, input.draftId))
        .returning();

      return updated;
    }),
});
