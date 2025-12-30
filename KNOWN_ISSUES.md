# Known Issues - Monday 12/30 EOD

## Critical: Node.js Postgres Driver Authentication Issue

### Problem
Both `postgres-js` and `pg` drivers fail to authenticate to the Docker Postgres container from the host machine (macOS), even though:
- ✅ The `echo_alpha` role exists in the container
- ✅ `psql` can connect from within the container
- ✅ `psql` can connect from the host via `docker exec`
- ✅ Postgres is listening on `0.0.0.0:5432`
- ✅ Port 5432 is mapped correctly
- ✅ `POSTGRES_HOST_AUTH_METHOD: trust` is set

### Error
```
error: role "echo_alpha" does not exist
code: '28000'
routine: 'InitializeSessionUserId'
```

### Impact
- ❌ Cannot run Node.js seed script
- ❌ Cannot use Drizzle Kit push command
- ❌ tRPC queries from Next.js frontend fail
- ❌ Cannot test AI email generation with real database

### Attempted Fixes
1. ✅ Switched from `postgres-js` to `pg` driver - same error
2. ✅ Set `POSTGRES_HOST_AUTH_METHOD: trust` - same error
3. ✅ Used `127.0.0.1` instead of `localhost` - same error
4. ✅ Removed password from connection - same error
5. ✅ Set `ssl: false` - same error
6. ✅ Restarted container with clean volume - same error

### Current Workaround
Using SQL files applied via `docker exec psql`:
```bash
docker exec -i echo-alpha-db psql -U echo_alpha -d echo_alpha < db/seed.sql
```

This works for seeding but doesn't solve the tRPC/Next.js connection issue.

### Possible Solutions for Tuesday

#### Option 1: Use Supabase Local (Recommended)
- Supabase provides a full Postgres stack with proper authentication
- Already proven to work (you have `papa-alpha` running)
- Command: `supabase init` + `supabase start`
- Pros: Production-like setup, no authentication issues
- Cons: Slightly more complex setup

#### Option 2: Use Different Docker Image
- Try `postgres:16` (non-alpine) or `supabase/postgres`
- Alpine images sometimes have authentication quirks on macOS

#### Option 3: Use Docker Network Mode
- Run Next.js dev server in Docker container
- Use Docker internal networking instead of host networking
- Pros: Eliminates host→container authentication issues
- Cons: More complex dev workflow

#### Option 4: Use PostgreSQL.app (macOS Native)
- Install Postgres natively on macOS
- No Docker networking issues
- Pros: Simple, reliable
- Cons: Not containerized, different from production

### Recommendation
**Start Tuesday by switching to Supabase local setup** - it's production-ready, has no authentication issues, and matches their likely production setup better than raw Docker Postgres.

## Monday Accomplishments (Despite Issue)

✅ **Infrastructure:**
- Docker Compose configured
- Database schema designed (4 tables)
- Migrations generated with Drizzle Kit
- Seed data created for Acme AI scenario

✅ **Backend:**
- tRPC routers created (deal.ts with 4 procedures)
- AI service structure defined
- Type-safe schema with Drizzle ORM

✅ **Frontend:**
- Next.js App Router setup
- Demo page created at `/demo`
- tRPC React Query provider configured

✅ **Data:**
- Database seeded via SQL (1 deal, 3 spaces, 2 emails)
- All relationships properly linked

## Tuesday Priority #1
Fix Postgres authentication to unblock AI integration work.
