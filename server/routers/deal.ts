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
    .mutation(async ({ input }) => {
      return {
        body: `Hi Sarah,\n\nGreat questions! Let me address each one:\n\n**Parking at FiDi Office:** Yes, TechCorp has parking available in their building garage.\n\n**SOMA After-Hours Access:** Yes, DesignStudio offers 24/7 access with your key card.\n\n**CloudScale Connection:** CloudScale is a YC W21 company building AI infrastructure - very similar stage to Acme AI! Happy to introduce you to their team.\n\n**Tour Schedule:**\nBased on your CEO's availability (Tuesday 2-4pm), I can arrange:\n- 2:00pm - FiDi Office (123 Market St)\n- 3:00pm - Mission District Hub (789 Valencia St) - only 15 min away!\n\nFor SOMA Creative Space, they don't have Tuesday afternoon availability. Could we do Wednesday 11am for that one with your CEO?\n\nLet me know if this works!\n\nBest,\nAlex`,
        confidence: 85,
        reasoning: {
          schedulingLogic: [
            'CEO available Tuesday 2-4pm or Wednesday 11am-12pm',
            'FiDi has Tuesday 2pm slot - scheduled first',
            'Mission has Tuesday 3pm slot - scheduled second (15 min from FiDi)',
            'SOMA has no Tuesday afternoon availability - proposed Wednesday 11am alternative',
          ],
          dataLookups: [
            {
              question: 'Does FiDi office have parking?',
              source: 'spaces.amenities.parking',
              answer: 'Yes, parking available',
            },
            {
              question: 'Can we access SOMA space after hours?',
              source: 'spaces.amenities.afterHours',
              answer: 'Yes, 24/7 access included',
            },
            {
              question: "What's the story with CloudScale?",
              source: 'spaces.hostContext',
              answer: 'YC W21 AI infrastructure startup, similar stage to Acme AI',
            },
          ],
          needsHumanReview: [
            'SOMA space requires Wednesday slot - confirm this works for CEO',
            'Consider if 2 tours in one day is too much, or if they prefer all 3 on different days',
          ],
        },
        suggestedActions: [
          'Send calendar invites once confirmed',
          'Introduce Sarah to CloudScale team',
          'Prepare tour briefing docs for each space',
        ],
        timeSaved: {
          traditional: 45,
          withAI: 3,
        },
      };
    }),
});
