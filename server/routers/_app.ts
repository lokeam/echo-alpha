import { router } from '../trpc';
import { dealRouter } from './deal';
import { draftRouter } from './draft';

export const appRouter = router({
  deal: dealRouter,
  draft: draftRouter,
});

export type AppRouter = typeof appRouter;
