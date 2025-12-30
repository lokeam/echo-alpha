import { router } from '../trpc';
import { dealRouter } from './deal';

export const appRouter = router({
  deal: dealRouter,
});

export type AppRouter = typeof appRouter;
