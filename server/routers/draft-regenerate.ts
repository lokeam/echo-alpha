import { z } from 'zod';
import { publicProcedure } from '../trpc';
import { emailDrafts, deals } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { regenerateEmailDraft } from '../services/emailGenerator';

/**
 * Regenerate draft with additional user instructions (max 3 times)
 */
export const regenerateProcedure = publicProcedure
  .input(z.object({
    draftId: z.number().positive(),
    userInstruction: z.string().min(10).max(500),
  }))
  .mutation(async ({ ctx, input }) => {
    const { pool } = await import('../../db/index');

    // Fetch current draft
    const existing = await ctx.db.query.emailDrafts.findFirst({
      where: eq(emailDrafts.id, input.draftId),
    });

    if (!existing) {
      throw new Error('Draft not found');
    }

    // Check regeneration limit
    if (existing.regenerationCount >= 3) {
      throw new Error('Maximum regeneration limit (3) reached. You can still manually edit the draft.');
    }

    // Check if draft is in editable state
    if (existing.status === 'sent') {
      throw new Error('Cannot regenerate a draft that has already been sent');
    }

    // Fetch original context
    const dealResult = await ctx.db.query.deals.findFirst({
      where: eq(deals.id, existing.dealId),
    });

    if (!dealResult) {
      throw new Error('Deal not found');
    }

    const spacesResult = await pool.query(
      `SELECT s.* FROM spaces s
       INNER JOIN deal_spaces ds ON s.id = ds.space_id
       WHERE ds.deal_id = $1`,
      [existing.dealId]
    );

    const emailThreadResult = await pool.query(
      'SELECT * FROM emails WHERE deal_id = $1 ORDER BY sent_at ASC',
      [existing.dealId]
    );

    const inboundEmailResult = await pool.query(
      'SELECT * FROM emails WHERE id = $1',
      [existing.inboundEmailId]
    );

    if (inboundEmailResult.rows.length === 0) {
      throw new Error('Inbound email not found');
    }

    // Get current version body
    const currentVersionBody = existing.finalBody || existing.aiGeneratedBody;
    const nextVersionNumber = existing.regenerationCount + 1;

    // Regenerate with AI
    const newDraft = await regenerateEmailDraft(
      {
        deal: dealResult,
        spaces: spacesResult.rows,
        emailThread: emailThreadResult.rows,
        inboundEmail: inboundEmailResult.rows[0],
      },
      currentVersionBody,
      input.userInstruction,
      nextVersionNumber
    );

    // Create new version object
    const newVersion = {
      version: nextVersionNumber,
      body: newDraft.body,
      prompt: input.userInstruction,
      confidence: newDraft.confidence,
      reasoning: newDraft.reasoning,
      metadata: newDraft.metadata,
      createdAt: new Date(),
    };

    // Get existing versions or initialize
    const existingVersions = existing.draftVersions || [];
    const updatedVersions = [...existingVersions, newVersion];

    // Update draft
    const [updated] = await ctx.db
      .update(emailDrafts)
      .set({
        regenerationCount: existing.regenerationCount + 1,
        currentVersion: nextVersionNumber,
        draftVersions: updatedVersions,
        finalBody: newDraft.body,
        confidenceScore: newDraft.confidence,
        reasoning: newDraft.reasoning,
        metadata: newDraft.metadata,
      })
      .where(eq(emailDrafts.id, input.draftId))
      .returning();

    return {
      draft: updated,
      newVersion,
      versionsRemaining: 3 - updated.regenerationCount,
    };
  });

/**
 * Switch to a different version from history
 */
export const switchVersionProcedure = publicProcedure
  .input(z.object({
    draftId: z.number().positive(),
    targetVersion: z.number().min(0).max(3),
  }))
  .mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.query.emailDrafts.findFirst({
      where: eq(emailDrafts.id, input.draftId),
    });

    if (!existing) {
      throw new Error('Draft not found');
    }

    const versions = existing.draftVersions || [];
    const targetVersionData = versions.find(v => v.version === input.targetVersion);

    if (!targetVersionData) {
      throw new Error(`Version ${input.targetVersion} not found`);
    }

    // Update current version and related fields
    const [updated] = await ctx.db
      .update(emailDrafts)
      .set({
        currentVersion: input.targetVersion,
        finalBody: targetVersionData.body,
        confidenceScore: targetVersionData.confidence,
        reasoning: targetVersionData.reasoning,
        metadata: targetVersionData.metadata,
      })
      .where(eq(emailDrafts.id, input.draftId))
      .returning();

    return updated;
  });
