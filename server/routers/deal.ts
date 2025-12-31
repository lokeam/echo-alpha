import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { deals, spaces, emails, dealSpaces } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';

export const dealRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const deal = await ctx.db.query.deals.findFirst({
        where: eq(deals.id, input.id),
      });
      return deal;
    }),

  getWithSpaces: publicProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ ctx, input }) => {
      const deal = await ctx.db.query.deals.findFirst({
        where: eq(deals.id, input.dealId),
      });

      const dealSpaceRecords = await ctx.db.query.dealSpaces.findMany({
        where: eq(dealSpaces.dealId, input.dealId),
        with: {
          space: true,
        },
      });

      const spacesList = await ctx.db.select().from(spaces).where(
        eq(spaces.id, dealSpaceRecords[0]?.spaceId || 0)
      );

      return {
        deal,
        spaces: spacesList,
      };
    }),

  getEmailThread: publicProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ input }) => {
      const { pool } = await import('../../db/index');
      const result = await pool.query(
        'SELECT * FROM emails WHERE deal_id = $1 ORDER BY sent_at ASC',
        [input.dealId]
      );
      return result.rows;
    }),

  generateEmailDraft: publicProcedure
    .input(z.object({
      dealId: z.number(),
      inboundEmailId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { generateEmailDraft } = await import('../services/emailGenerator');
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
      const draft = await generateEmailDraft({
        deal: dealResult,
        spaces: spacesResult.rows,
        emailThread: emailThreadResult.rows,
        inboundEmail: inboundEmailResult.rows[0],
      });

      return draft;
    }),
});
