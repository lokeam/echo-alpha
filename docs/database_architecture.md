# Echo Alpha - Database Architecture

PostgreSQL database (via Supabase local) providing persistent storage for the Echo Alpha AI email assistant. The database handles deal tracking, space inventory, email threads, and AI-generated draft management with version history.

## Architecture Overview

The database layer uses a modern stack optimized for type safety and developer experience:

```
Application Layer (Next.js + tRPC)
         ↓
   Drizzle ORM (Type-safe query builder)
         ↓
   node-postgres Pool (Connection management)
         ↓
   PostgreSQL 15+ (Supabase local via Docker)
```

**Key Design Principles:**
- **Type safety first** - Drizzle ORM provides end-to-end TypeScript inference
- **Schema as source of truth** - `db/schema.ts` defines structure, migrations generated from it
- **Strategic JSONB usage** - Flexible storage for AI-generated data and nested structures
- **Soft deletes** - Compliance-aware archiving with audit trails
- **Minimal indexes** - Optimized for development speed, production recommendations provided

## Entity Relationship Diagram

```
┌─────────────┐
│   deals     │
│─────────────│
│ id (PK)     │◄──┐
│ seeker_name │   │
│ company     │   │
│ team_size   │   │
│ budget      │   │
│ requirements│   │  1:N
│ stage       │   │
└─────────────┘   │
                  │
       ┌──────────┼──────────┐
       │          │          │
       │          │          │
┌──────▼──────┐   │   ┌──────▼──────┐
│deal_spaces  │   │   │   emails    │
│─────────────│   │   │─────────────│
│ id (PK)     │   │   │ id (PK)     │
│ deal_id(FK) │───┘   │ deal_id(FK) │
│ space_id(FK)│───┐   │ from        │
│ status      │   │   │ to          │
└─────────────┘   │   │ subject     │
                  │   │ body        │
           ┌──────┘   │ ai_metadata │
           │          └──────┬──────┘
           │                 │
    ┌──────▼──────┐          │ 1:1
    │   spaces    │          │
    │─────────────│          │
    │ id (PK)     │   ┌──────▼──────────┐
    │ name        │   │ email_drafts    │
    │ address     │   │─────────────────│
    │ host_company│   │ id (PK)         │
    │ amenities   │   │ deal_id (FK)    │
    │ availability│   │ inbound_email_id│
    │ monthly_rate│   │ ai_generated_body
    │ detailed_   │   │ final_body      │
    │   amenities │   │ confidence_score│
    └─────────────┘   │ reasoning       │
                      │ draft_versions  │
                      │ regeneration_   │
                      │   count         │
                      │ current_version │
                      │ status          │
                      │ sent_email_id   │
                      │ archived_at     │
                      └─────────────────┘
```

## Schema Design

### Table: `deals`

**Purpose:** Track client deals and space search requirements.

**Schema:**
```sql
CREATE TABLE deals (
  id                serial PRIMARY KEY,
  seeker_name       varchar(255) NOT NULL,
  seeker_email      varchar(255) NOT NULL,
  company_name      varchar(255) NOT NULL,
  team_size         integer NOT NULL,
  monthly_budget    integer NOT NULL,
  requirements      jsonb NOT NULL,
  stage             varchar(50) NOT NULL,
  created_at        timestamp DEFAULT now() NOT NULL
);
```

**JSONB Structure (`requirements`):**
```typescript
{
  dogFriendly?: boolean;
  parking?: boolean;
  afterHours?: boolean;
  location?: string;
}
```

**Business Rules:**
- `team_size` must be positive
- `monthly_budget` in dollars (not cents)
- `stage` values: `inquiry`, `touring`, `negotiating`, `closed`
- `requirements` is flexible JSONB to accommodate evolving client needs

**Why JSONB for requirements?**
- Client requirements vary widely (some need parking, others don't)
- Adding new requirement types doesn't require migrations
- Easy to query with `@>` operator: `WHERE requirements @> '{"dogFriendly": true}'`

---

### Table: `spaces`

**Purpose:** Office space inventory with amenities and availability.

**Schema:**
```sql
CREATE TABLE spaces (
  id                serial PRIMARY KEY,
  name              varchar(255) NOT NULL,
  address           text NOT NULL,
  neighborhood      varchar(100),
  host_company      varchar(255) NOT NULL,
  host_email        varchar(255) NOT NULL,
  host_context      text,
  amenities         jsonb NOT NULL,
  availability      jsonb NOT NULL,
  monthly_rate      integer NOT NULL,
  detailed_amenities jsonb,
  created_at        timestamp DEFAULT now() NOT NULL
);
```

**JSONB Structure (`amenities`):**
```typescript
{
  parking?: boolean;
  dogFriendly?: boolean;
  afterHours?: boolean;
  [key: string]: boolean | undefined;
}
```

**JSONB Structure (`availability`):**
```typescript
{
  tuesday?: string[];    // ["2pm", "4pm"]
  wednesday?: string[];  // ["10am", "11am", "2pm"]
  [key: string]: string[] | undefined;
}
```

**JSONB Structure (`detailed_amenities`):**
```typescript
{
  parking?: {
    type?: string;              // "off-site", "building-garage", "street-only"
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
    system?: string;            // "Key card (Honeywell)", "Smart lock"
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
}
```

**Design Rationale:**
- `amenities` = simple boolean flags for filtering
- `detailed_amenities` = rich nested data for AI context
- Two-tier approach balances query performance with data richness
- `host_context` provides background for AI ("YC W21 startup, similar stage to client")

**Migration History:**
- Added in migration 0000 (initial schema)
- `detailed_amenities` added in migration 0003 for enhanced AI reasoning

---

### Table: `emails`

**Purpose:** Email thread history for deals (both human and AI-generated).

**Schema:**
```sql
CREATE TABLE emails (
  id            serial PRIMARY KEY,
  deal_id       integer NOT NULL REFERENCES deals(id),
  from          varchar(255) NOT NULL,
  to            varchar(255) NOT NULL,
  subject       text NOT NULL,
  body          text NOT NULL,
  sent_at       timestamp DEFAULT now() NOT NULL,
  ai_generated  boolean DEFAULT false,
  ai_metadata   jsonb
);
```

**JSONB Structure (`ai_metadata`):**
```typescript
{
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
}
```

**Business Rules:**
- `deal_id` foreign key ensures emails belong to a deal
- `sent_at` ordered chronologically for thread display
- `ai_generated` flag distinguishes AI vs human emails
- No unique constraint on `(from, to, subject)` - threads can have duplicate subjects

**Why allow duplicate emails?**
- Email threads naturally have "Re: " subjects
- Same parties exchange multiple emails
- Uniqueness would break realistic thread modeling

---

### Table: `deal_spaces`

**Purpose:** Many-to-many junction table linking deals to spaces.

**Schema:**
```sql
CREATE TABLE deal_spaces (
  id        serial PRIMARY KEY,
  deal_id   integer NOT NULL REFERENCES deals(id),
  space_id  integer NOT NULL REFERENCES spaces(id),
  status    varchar(50) NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);
```

**Status Values:**
- `shown` - Space shown to client
- `interested` - Client expressed interest
- `touring` - Tour scheduled
- `rejected` - Client rejected space
- `selected` - Client selected space

**Query Pattern:**
```sql
-- Get all spaces for a deal
SELECT s.*
FROM spaces s
INNER JOIN deal_spaces ds ON s.id = ds.space_id
WHERE ds.deal_id = $1;
```

**Why separate junction table?**
- Allows tracking status per deal-space relationship
- Supports N:M (one deal can have multiple spaces, one space can be in multiple deals)
- Enables historical tracking (when was space shown?)

---

### Table: `email_drafts`

**Purpose:** AI-generated email drafts with version history and refinement tracking.

**Schema:**
```sql
CREATE TABLE email_drafts (
  id                    serial PRIMARY KEY,
  deal_id               integer NOT NULL REFERENCES deals(id),
  inbound_email_id      integer NOT NULL REFERENCES emails(id),
  ai_generated_body     text NOT NULL,
  edited_body           text,
  final_body            text,
  confidence_score      integer NOT NULL,
  status                varchar(50) DEFAULT 'pending' NOT NULL,
  reasoning             jsonb,
  metadata              jsonb,
  regeneration_count    integer DEFAULT 0 NOT NULL,
  last_regeneration_at  timestamp,
  current_version       integer DEFAULT 0 NOT NULL,
  draft_versions        jsonb,
  created_at            timestamp DEFAULT now() NOT NULL,
  reviewed_at           timestamp,
  reviewed_by           varchar(255),
  sent_at               timestamp,
  sent_email_id         integer REFERENCES emails(id),
  archived_at           timestamp,
  archived_by           varchar(255),
  archive_reason        text
);
```

**JSONB Structure (`reasoning`):**
```typescript
{
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
}
```

**JSONB Structure (`metadata`):**
```typescript
{
  model: string;           // "gpt-4o-mini"
  tokensUsed: number;
  generatedAt: Date;
  validationTokensUsed?: number;  -- NEW: ~300 tokens for validation call
}
```

**JSONB Structure (`validation`):** (NEW)
```typescript
{
  status: 'passed' | 'warnings' | 'failed';
  issues: string[];        // Array of validation issues found
  checkedAt: Date;         // When validation was performed
}
```

**Validation Status Values:**
- `passed` - No issues found, all facts verified
- `warnings` - Minor issues detected (e.g., unverified amenity)
- `failed` - Major issues detected (e.g., wrong price, hallucinated data)

**JSONB Structure (`draft_versions`):**
```typescript
Array<{
  version: number;         // 0, 1, 2, 3
  body: string;
  prompt: string | null;   // User refinement instruction (null for v0)
  confidence: number;
  reasoning: { /* same as above */ };
  metadata: { /* same as above */ };
  createdAt: Date;
}>
```

**Status State Machine:**
```
pending → approved → sent
   ↓         ↓        ↓
   └─────────┴────────┴──→ archived
```

**Business Rules:**
- `regeneration_count` max 3 (free tier limit)
- 24-hour cooldown after 3 regenerations
- Cannot regenerate or edit sent drafts
- Archive is soft delete (preserves for compliance)
- `final_body` = current active version body
- `current_version` points to active version in `draft_versions` array

**Version History Design:**

**Why JSONB array instead of separate table?**

| Approach | Pros | Cons |
|----------|------|------|
| **JSONB array** (chosen) | Simple queries, atomic updates, no JOINs | Max 4 versions, harder to query individual versions |
| **Separate table** | Unlimited versions, easier to query | Requires JOINs, more complex queries, more tables |

**Decision:** JSONB array is sufficient because:
- Free tier limits to 3 refinements (4 total versions)
- Versions always fetched together (no need for individual queries)
- Atomic updates prevent race conditions
- Simpler mental model for developers

**Migration History:**
- Added in migration 0001 (initial draft table)
- Version fields added in migration 0002 (`regeneration_count`, `current_version`, `draft_versions`)
- Cooldown field added in migration 0003 (`last_regeneration_at`)

---

## Migration Strategy

### Development Workflow

**Tool:** Drizzle Kit (schema-first approach)

**Process:**
1. Modify `db/schema.ts` (TypeScript schema definition)
2. Run `npm run db:push` (pushes changes directly to database)
3. Drizzle Kit generates migration SQL in `drizzle/` folder
4. Restart dev server to pick up schema changes

**Why `push` instead of `migrate`?**
- **Development speed** - No manual migration writing
- **Supabase local** - Docker container can be reset easily
- **Rapid iteration** - Schema changes are frequent during development

**Production Recommendation:**
- Switch to `npm run db:generate` → `npm run db:migrate`
- Review generated SQL before applying
- Use migration versioning for rollback capability
- Never use `push` in production

### Migration History

**Migration 0000: Initial Schema** (`0000_clear_sleepwalker.sql`)
```sql
-- Created 4 tables: deals, spaces, emails, deal_spaces
-- Established foreign key relationships
-- Set up basic constraints and defaults
```

**Migration 0001: Email Drafts** (`0001_solid_rogue.sql`)
```sql
-- Added email_drafts table
-- Foreign keys to deals and emails
-- Basic draft fields (body, confidence, status)
```

**Migration 0002: Version Control** (`0002_spooky_wallop.sql`)
```sql
-- Added regeneration_count (default 0)
-- Added current_version (default 0)
-- Added draft_versions (JSONB array)
```

**Migration 0003: Enhanced Features** (`0003_wooden_valeria_richards.sql`)
```sql
-- Added last_regeneration_at (for cooldown logic)
-- Added detailed_amenities to spaces (for AI context)
```

### Rollback Strategy

**Development:**
```bash
make db-reset  # Nuclear option: destroys all data, fresh start
make db-fresh  # Quick reset: push schema + seed data
```

**Production (recommended):**
```bash
# Revert to specific migration
npm run db:migrate -- --to 0002

# Or write down migration
drizzle-kit generate --name revert_feature_x
# Edit generated SQL to reverse changes
npm run db:migrate
```

### Schema Drift Detection

Drizzle Kit automatically detects drift between `schema.ts` and database:

```bash
npm run db:push
# Output: "No schema changes detected" or "Changes found: ..."
```

**Common drift scenarios:**
- Manual SQL changes in database
- Migration applied but schema.ts not updated
- Multiple developers with different schema versions

**Resolution:**
```bash
make db-fresh  # Resets to schema.ts as source of truth
```

---

## Query Patterns

### Drizzle ORM Queries

**Type-safe query builder with full TypeScript inference:**

```typescript
// Simple select
const deal = await db.query.deals.findFirst({
  where: eq(deals.id, dealId),
});

// With relations
const dealWithEmails = await db.query.deals.findFirst({
  where: eq(deals.id, dealId),
  with: {
    emails: true,
  },
});

// Insert with returning
const [newDraft] = await db.insert(emailDrafts).values({
  dealId: 1,
  inboundEmailId: 7,
  aiGeneratedBody: 'Hi Sarah...',
  confidenceScore: 85,
  status: 'pending',
}).returning();

// Update
await db.update(emailDrafts)
  .set({ status: 'sent', sentAt: new Date() })
  .where(eq(emailDrafts.id, draftId));

// Delete (rarely used - prefer soft delete)
await db.delete(emailDrafts)
  .where(eq(emailDrafts.id, draftId));
```

### Raw SQL Queries

**When to use raw SQL:**
- Complex JOINs (deal_spaces many-to-many)
- Performance-critical queries
- JSONB operators not supported by Drizzle query builder
- Legacy compatibility

**Example: Fetch spaces for a deal**
```typescript
const { pool } = await import('../../db/index');

const spacesResult = await pool.query(
  `SELECT s.*
   FROM spaces s
   INNER JOIN deal_spaces ds ON s.id = ds.space_id
   WHERE ds.deal_id = $1`,
  [dealId]
);

const spaces = spacesResult.rows;
```

**Example: Fetch draft with related data**
```typescript
const result = await pool.query(
  `SELECT
    ed.*,
    d.company_name,
    d.seeker_email,
    e.subject as inbound_subject,
    e.body as inbound_body
   FROM email_drafts ed
   INNER JOIN deals d ON ed.deal_id = d.id
   INNER JOIN emails e ON ed.inbound_email_id = e.id
   WHERE ed.id = $1`,
  [draftId]
);
```

**Why raw SQL here?**
- Drizzle relations require separate queries (N+1 problem)
- Single JOIN query is more efficient
- Full control over SELECT fields

### JSONB Querying

**Operators:**
- `->` - Get JSON object field as JSON
- `->>` - Get JSON object field as text
- `@>` - Contains (does left JSON contain right JSON?)
- `?` - Does key exist?

**Examples:**
```sql
-- Find deals requiring parking
SELECT * FROM deals
WHERE requirements @> '{"parking": true}';

-- Find spaces with dog-friendly amenity
SELECT * FROM spaces
WHERE amenities @> '{"dogFriendly": true}';

-- Get parking cost from detailed_amenities
SELECT
  name,
  detailed_amenities->'parking'->>'costMonthly' as parking_cost
FROM spaces
WHERE detailed_amenities->'parking' IS NOT NULL;

-- Find drafts with high confidence
SELECT * FROM email_drafts
WHERE (metadata->>'tokensUsed')::int > 1000;
```

**Performance Note:**
- JSONB queries without indexes are slow on large tables
- GIN indexes recommended for production (not currently implemented)

### N+1 Query Prevention

**Problem:**
```typescript
// BAD: N+1 queries
const deals = await db.query.deals.findMany();
for (const deal of deals) {
  const emails = await db.query.emails.findMany({
    where: eq(emails.dealId, deal.id),
  });
}
```

**Solution 1: Drizzle relations**
```typescript
// GOOD: Single query with JOIN
const deals = await db.query.deals.findMany({
  with: {
    emails: true,
  },
});
```

**Solution 2: Raw SQL JOIN**
```typescript
// GOOD: Explicit JOIN control
const result = await pool.query(`
  SELECT
    d.*,
    json_agg(e.*) as emails
  FROM deals d
  LEFT JOIN emails e ON e.deal_id = d.id
  GROUP BY d.id
`);
```

---

## Data Integrity

### Foreign Key Constraints

**All foreign keys use default `ON DELETE NO ACTION`:**

```sql
-- deal_spaces → deals
FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE NO ACTION

-- deal_spaces → spaces
FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE NO ACTION

-- emails → deals
FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE NO ACTION

-- email_drafts → deals
FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE NO ACTION

-- email_drafts → emails (inbound)
FOREIGN KEY (inbound_email_id) REFERENCES emails(id) ON DELETE NO ACTION

-- email_drafts → emails (sent)
FOREIGN KEY (sent_email_id) REFERENCES emails(id) ON DELETE NO ACTION
```

**Why `NO ACTION`?**
- Prevents accidental cascading deletes
- Requires explicit cleanup logic
- Safer for production (can't accidentally delete deal and lose all emails)

**Production Consideration:**
- Implement soft delete for deals (add `deleted_at` column)
- Or use `ON DELETE CASCADE` with careful application logic

### Soft Delete Pattern

**Archive fields in `email_drafts`:**
```typescript
archived_at: timestamp       // When archived
archived_by: varchar(255)    // Who archived (user email)
archive_reason: text         // Why archived (optional)
```

**Archive logic:**
```typescript
await db.update(emailDrafts)
  .set({
    status: 'archived',
    archivedAt: new Date(),
    archivedBy: userEmail,
    archiveReason: reason,
  })
  .where(eq(emailDrafts.id, draftId));
```

**Why soft delete?**
- **Compliance** - Real estate emails are legal records
- **Audit trail** - Can investigate why draft was archived
- **Recovery** - Can restore archived drafts if needed
- **Analytics** - Can analyze rejection patterns

**Query pattern:**
```typescript
// Exclude archived drafts
const activeDrafts = await db.query.emailDrafts.findMany({
  where: and(
    eq(emailDrafts.dealId, dealId),
    isNull(emailDrafts.archivedAt)
  ),
});
```

### Audit Trail

**Timestamp tracking:**
- `created_at` - When record created (all tables)
- `reviewed_at` - When draft reviewed by human
- `sent_at` - When email sent
- `archived_at` - When draft archived
- `last_regeneration_at` - When last AI refinement occurred

**User tracking:**
- `reviewed_by` - Who reviewed draft
- `archived_by` - Who archived draft

**Why no `updated_at`?**
- Not needed for current use case
- Can be added later if audit requirements change
- Draft versions provide implicit update history

### Status State Machine

**Draft lifecycle:**
```
pending ──approve──> approved ──send──> sent
  │          │                           │
  │          │                           │
  └──────────┴───────archive─────────────┴──> archived
```

**State transitions:**
```typescript
// Pending → Approved
status: 'pending' → 'approved'
reviewed_at: null → new Date()
reviewed_by: null → userEmail

// Approved → Sent
status: 'approved' → 'sent'
sent_at: null → new Date()
sent_email_id: null → emailId

// Any → Archived
status: any → 'archived'
archived_at: null → new Date()
archived_by: null → userEmail
```

**Validation rules:**
- Cannot send draft that's not approved (enforced in application)
- Cannot regenerate sent draft (enforced in tRPC mutation)
- Cannot edit sent draft (enforced in UI)
- Can archive from any state (compliance requirement)

---

## Connection Management

### node-postgres Pool

**Configuration:** `db/index.ts`
```typescript
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@127.0.0.1:54422/postgres',
});
```

**Default pool settings:**
- `max: 10` - Maximum connections (node-postgres default)
- `idleTimeoutMillis: 30000` - Close idle connections after 30s
- `connectionTimeoutMillis: 2000` - Fail if can't connect in 2s

**Production tuning:**
```typescript
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Increase for high traffic
  idleTimeoutMillis: 10000,   // Close idle faster
  connectionTimeoutMillis: 5000,
  ssl: {
    rejectUnauthorized: false, // For Supabase hosted
  },
});
```

### Drizzle ORM Initialization

**Configuration:** `db/index.ts`
```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export const db = drizzle(pool, { schema });
```

**Type inference:**
```typescript
// Drizzle automatically infers types from schema
export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;

// Usage
const deal: Deal = await db.query.deals.findFirst(...);
```

**Why pass schema to drizzle()?**
- Enables relational queries (`db.query.deals.findFirst({ with: { emails: true } })`)
- Provides type inference for relations
- Required for Drizzle's query builder

### Connection String Format

**Development (Supabase local):**
```
postgresql://postgres:postgres@127.0.0.1:54422/postgres
```

**Production (Supabase hosted):**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

**Environment variable:**
```bash
# .env.local
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54422/postgres
```

**Fallback logic:**
```typescript
connectionString: process.env.DATABASE_URL || 'postgresql://...'
```

**Why fallback?**
- Development convenience (works without .env file)
- Matches Supabase local defaults
- Fails safely (won't connect to production by accident)

### Error Handling

**Connection errors:**
```typescript
try {
  const result = await pool.query('SELECT * FROM deals');
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    console.error('Database not running. Run: make dev');
  } else if (error.code === '42P01') {
    console.error('Table does not exist. Run: make db-fresh');
  } else {
    console.error('Database error:', error);
  }
}
```

**Common error codes:**
- `ECONNREFUSED` - Database not running
- `42P01` - Undefined table
- `23505` - Unique constraint violation
- `23503` - Foreign key violation
- `42703` - Undefined column

---

## Performance Considerations

### Missing Indexes

**Current state:** Only primary keys and foreign keys have indexes (automatic).

**Production recommendations:**

```sql
-- Foreign key indexes (improve JOIN performance)
CREATE INDEX idx_emails_deal_id ON emails(deal_id);
CREATE INDEX idx_deal_spaces_deal_id ON deal_spaces(deal_id);
CREATE INDEX idx_deal_spaces_space_id ON deal_spaces(space_id);
CREATE INDEX idx_email_drafts_deal_id ON email_drafts(deal_id);
CREATE INDEX idx_email_drafts_inbound_email_id ON email_drafts(inbound_email_id);

-- Status filtering (common query pattern)
CREATE INDEX idx_email_drafts_status ON email_drafts(status);

-- Timestamp ordering (email threads)
CREATE INDEX idx_emails_sent_at ON emails(sent_at);

-- JSONB indexes (for amenity filtering)
CREATE INDEX idx_spaces_amenities ON spaces USING GIN (amenities);
CREATE INDEX idx_deals_requirements ON deals USING GIN (requirements);
CREATE INDEX idx_email_drafts_reasoning ON email_drafts USING GIN (reasoning);

-- Composite indexes (common query combinations)
CREATE INDEX idx_email_drafts_deal_status ON email_drafts(deal_id, status);
CREATE INDEX idx_emails_deal_sent ON emails(deal_id, sent_at);
```

**Why not added yet?**
- Development database is small (< 100 rows)
- Indexes slow down writes (INSERT/UPDATE)
- Premature optimization
- Will add when performance testing shows need

### Query Performance Analysis

**EXPLAIN example:**
```sql
EXPLAIN ANALYZE
SELECT s.*
FROM spaces s
INNER JOIN deal_spaces ds ON s.id = ds.space_id
WHERE ds.deal_id = 1;
```

**Output interpretation:**
```
Nested Loop  (cost=0.00..24.50 rows=3 width=...)
  -> Seq Scan on deal_spaces ds  (cost=0.00..12.00 rows=3 width=4)
        Filter: (deal_id = 1)
  -> Index Scan using spaces_pkey on spaces s  (cost=0.00..4.16 rows=1 width=...)
        Index Cond: (id = ds.space_id)
```

**Performance tips:**
- `Seq Scan` on small tables is fine (< 1000 rows)
- `Index Scan` is good for large tables
- `cost` is relative (lower is better)
- `rows` is estimated row count

### JSONB Performance

**Without GIN index:**
```sql
-- Slow on large tables (sequential scan)
SELECT * FROM spaces
WHERE amenities @> '{"parking": true}';
```

**With GIN index:**
```sql
-- Fast (index scan)
CREATE INDEX idx_spaces_amenities ON spaces USING GIN (amenities);
SELECT * FROM spaces
WHERE amenities @> '{"parking": true}';
```

**Trade-offs:**
- GIN indexes are large (2-3x table size)
- Slower writes (index must be updated)
- Faster JSONB queries (10-100x speedup)

**Recommendation:**
- Add GIN indexes in production if JSONB filtering is common
- Monitor query performance with `pg_stat_statements`

---

## Development Workflow

### Makefile Commands

**Start development:**
```bash
make dev
# Starts Supabase (Docker) + Next.js dev server
```

**Quick database refresh:**
```bash
make db-fresh
# Push schema + seed data (no confirmation)
```

**Nuclear reset:**
```bash
make db-reset
# Stop Supabase → Remove volumes → Fresh start → Push schema → Seed
# Requires confirmation (destructive)
```

**Check database status:**
```bash
make db-status
# Shows: Supabase status, tables, sample data count
```

**Stop all services:**
```bash
make clean
# Stops Supabase (Next.js must be stopped manually with Ctrl+C)
```

### Schema Change Workflow

**Step-by-step:**

1. **Modify schema:** Edit `db/schema.ts`
   ```typescript
   export const deals = pgTable('deals', {
     // ... existing fields
     priority: varchar('priority', { length: 20 }), // NEW
   });
   ```

2. **Push to database:**
   ```bash
   npm run db:push
   # Drizzle Kit generates migration and applies it
   ```

3. **Verify migration:**
   ```bash
   ls drizzle/
   # New file: 0004_some_name.sql
   ```

4. **Restart dev server:**
   ```bash
   # Ctrl+C to stop
   make dev
   ```

5. **Update seed data (if needed):**
   ```typescript
   // db/seed.ts
   await db.insert(deals).values({
     // ... existing fields
     priority: 'high', // NEW
   });
   ```

6. **Re-seed:**
   ```bash
   make db-seed
   ```

### Debugging Database Issues

**Connection refused:**
```bash
make db-status
# If Supabase not running:
npx supabase start
```

**Table does not exist:**
```bash
make db-fresh
# Pushes schema + seeds data
```

**Schema drift:**
```bash
# Check what Drizzle thinks should change
npm run db:push
# Output: "Changes found: ..." or "No changes"
```

**Data corruption:**
```bash
make db-reset
# Nuclear option: destroys all data, fresh start
```

**Inspect database directly:**
```bash
# Connect with psql
psql postgresql://postgres:postgres@127.0.0.1:54422/postgres

# List tables
\dt

# Describe table
\d email_drafts

# Query data
SELECT * FROM deals;

# Exit
\q
```

---

## Production Considerations

### Migration Strategy

**Development:** Use `drizzle-kit push`
- Fast iteration
- No migration review needed
- Safe to reset database

**Production:** Use `drizzle-kit generate` + `drizzle-kit migrate`
- Review generated SQL before applying
- Version control migrations
- Rollback capability
- Audit trail of schema changes

**Migration workflow:**
```bash
# 1. Generate migration
npm run db:generate -- --name add_priority_field

# 2. Review generated SQL
cat drizzle/0004_add_priority_field.sql

# 3. Apply migration
npm run db:migrate

# 4. Verify
psql $DATABASE_URL -c "\d deals"
```

### Backup Strategy

**pg_dump (full backup):**
```bash
pg_dump $DATABASE_URL > backup.sql
```

**Restore:**
```bash
psql $DATABASE_URL < backup.sql
```

**Supabase hosted (automatic):**
- Daily backups (retained 7 days on free tier)
- Point-in-time recovery (Pro plan)
- Manual backups via dashboard

**Recommendation:**
- Daily automated backups to S3
- Weekly full backups
- Test restore procedure monthly

### Monitoring

**Key metrics:**
- Connection pool utilization
- Query performance (slow query log)
- Table sizes (disk usage)
- Index hit ratio
- JSONB query performance

**Tools:**
- `pg_stat_statements` - Query performance tracking
- `pg_stat_activity` - Active connections
- Supabase dashboard - Built-in monitoring
- Datadog/New Relic - APM integration

**Slow query example:**
```sql
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slow queries
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Scaling Considerations

**Vertical scaling:**
- Increase Supabase instance size (CPU/RAM)
- Increase connection pool size
- Add more indexes

**Horizontal scaling:**
- Read replicas for read-heavy workloads
- Connection pooling (PgBouncer)
- Caching layer (Redis)

**Current bottlenecks:**
- OpenAI API latency (2-4s) > database queries (< 100ms)
- Database is not the bottleneck yet
- Can handle 1000s of requests/day without scaling

**When to scale:**
- Connection pool exhaustion (> 80% utilization)
- Query latency > 500ms
- Table size > 1M rows
- Concurrent users > 100

---

## Security

### Row-Level Security (RLS)

**Current state:** Not implemented (development only)

**Production recommendation:**
```sql
-- Enable RLS on sensitive tables
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own drafts
CREATE POLICY user_drafts ON email_drafts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only update their own drafts
CREATE POLICY user_drafts_update ON email_drafts
  FOR UPDATE
  USING (auth.uid() = user_id);
```

**Why not implemented yet?**
- No authentication system (demo app)
- Single-user development environment
- Would add complexity without benefit

### Connection Security

**Development:** Unencrypted connection (localhost)

**Production:** SSL/TLS required
```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
  },
});
```

### Secrets Management

**Current:** Environment variables in `.env.local`

**Production:**
- Use Vercel environment variables (encrypted)
- Or AWS Secrets Manager
- Or HashiCorp Vault
- Never commit `.env` files to git

---

## Advanced Topics

### JSONB vs Normalized Tables

**When to use JSONB:**
- Schema varies by record (client requirements)
- Nested data (detailed_amenities)
- AI-generated data (reasoning, metadata)
- Rapid schema evolution

**When to use normalized tables:**
- Frequent queries on specific fields
- Need foreign key constraints
- Require complex JOINs
- Data integrity is critical

**Example: Why `draft_versions` is JSONB:**
- Max 4 versions (known limit)
- Always fetched together
- No need to query individual versions
- Simpler than separate table

**Example: Why `spaces` is normalized:**
- Frequently queried
- Need to JOIN with deals
- Foreign key to deal_spaces
- Stable schema

### Transactions

**Current state:** Not used

**When needed:**
- Multi-table updates that must be atomic
- Financial operations
- Inventory management

**Example: Send draft (should be transactional):**
```typescript
await pool.query('BEGIN');
try {
  // 1. Create email record
  const [email] = await db.insert(emails).values({
    dealId,
    from: 'agent@tandem.space',
    to: draft.seekerEmail,
    subject: `Re: ${draft.inboundSubject}`,
    body: draft.finalBody,
    aiGenerated: true,
    aiMetadata: {
      confidence: draft.confidenceScore,
      reasoning: draft.reasoning,
    },
  }).returning();

  // 2. Update draft
  await db.update(emailDrafts)
    .set({
      status: 'sent',
      sentAt: new Date(),
      sentEmailId: email.id,
    })
    .where(eq(emailDrafts.id, draftId));

  await pool.query('COMMIT');
} catch (error) {
  await pool.query('ROLLBACK');
  throw error;
}
```

**Why not implemented?**
- Current operations are idempotent
- Failure scenarios are rare
- Can be added later if needed

### Concurrent Updates

**Problem:** Two users edit same draft simultaneously

**Current behavior:** Last write wins (no locking)

**Solutions:**

**Optimistic locking:**
```typescript
// Add version column
version: integer DEFAULT 1

// Update with version check
const result = await db.update(emailDrafts)
  .set({
    finalBody: newBody,
    version: draft.version + 1,
  })
  .where(and(
    eq(emailDrafts.id, draftId),
    eq(emailDrafts.version, draft.version)
  ))
  .returning();

if (result.length === 0) {
  throw new Error('Draft was modified by another user');
}
```

**Pessimistic locking:**
```sql
SELECT * FROM email_drafts
WHERE id = $1
FOR UPDATE;
```

**Recommendation:**
- Not needed for current use case (single user)
- Add optimistic locking if multi-user editing is required

---

## Common Queries

### Fetch deal with spaces
```typescript
const { pool } = await import('../../db/index');

const spacesResult = await pool.query(
  `SELECT s.*
   FROM spaces s
   INNER JOIN deal_spaces ds ON s.id = ds.space_id
   WHERE ds.deal_id = $1`,
  [dealId]
);
```

### Fetch email thread ordered by date
```typescript
const emailThread = await db.query.emails.findMany({
  where: eq(emails.dealId, dealId),
  orderBy: [asc(emails.sentAt)],
});
```

### Get draft with version history
```typescript
const draft = await db.query.emailDrafts.findFirst({
  where: eq(emailDrafts.id, draftId),
});

// Access versions
const versions = draft.draftVersions || [];
const currentVersion = versions.find(v => v.version === draft.currentVersion);
```

### Switch draft version
```typescript
const versions = draft.draftVersions || [];
const targetVersion = versions.find(v => v.version === targetVersionNumber);

await db.update(emailDrafts)
  .set({
    currentVersion: targetVersionNumber,
    finalBody: targetVersion.body,
    confidenceScore: targetVersion.confidence,
    reasoning: targetVersion.reasoning,
    metadata: targetVersion.metadata,
  })
  .where(eq(emailDrafts.id, draftId));
```

### Archive draft (soft delete)
```typescript
await db.update(emailDrafts)
  .set({
    status: 'archived',
    archivedAt: new Date(),
    archivedBy: userEmail,
    archiveReason: reason,
  })
  .where(eq(emailDrafts.id, draftId));
```

### Send draft
```typescript
// 1. Create email record
const [email] = await db.insert(emails).values({
  dealId: draft.dealId,
  from: 'agent@tandem.space',
  to: draft.seekerEmail,
  subject: `Re: ${draft.inboundSubject}`,
  body: draft.finalBody,
  aiGenerated: true,
  aiMetadata: {
    confidence: draft.confidenceScore,
    reasoning: draft.reasoning,
  },
}).returning();

// 2. Update draft
await db.update(emailDrafts)
  .set({
    status: 'sent',
    sentAt: new Date(),
    sentEmailId: email.id,
  })
  .where(eq(emailDrafts.id, draftId));
```

---

## Troubleshooting Guide

### "relation does not exist"

**Cause:** Tables not created

**Solution:**
```bash
make db-fresh
```

### "column does not exist"

**Cause:** Schema drift (database doesn't match schema.ts)

**Solution:**
```bash
npm run db:push
# Or for clean slate:
make db-reset
```

### "regenerationCount is undefined"

**Cause:** Snake_case to camelCase transformation missing

**Solution:** Check tRPC router transformation:
```typescript
return {
  ...row,
  regenerationCount: row.regeneration_count,
  currentVersion: row.current_version,
  // ... all fields
};
```

### Slow queries

**Cause:** Missing indexes

**Solution:**
```sql
-- Add index for slow query
CREATE INDEX idx_emails_deal_id ON emails(deal_id);

-- Verify with EXPLAIN
EXPLAIN ANALYZE SELECT * FROM emails WHERE deal_id = 1;
```

### Connection pool exhausted

**Cause:** Too many concurrent connections

**Solution:**
```typescript
// Increase pool size
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Increase from default 10
});
```

### "ECONNREFUSED"

**Cause:** Database not running

**Solution:**
```bash
make db-status
npx supabase start
```

### Data corruption

**Cause:** Manual SQL changes or migration issues

**Solution:**
```bash
make db-reset  # Nuclear option
```

---

## Appendix

### Full SQL Schema

```sql
-- Generated by Drizzle Kit

CREATE TABLE deals (
  id serial PRIMARY KEY,
  seeker_name varchar(255) NOT NULL,
  seeker_email varchar(255) NOT NULL,
  company_name varchar(255) NOT NULL,
  team_size integer NOT NULL,
  monthly_budget integer NOT NULL,
  requirements jsonb NOT NULL,
  stage varchar(50) NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE spaces (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  address text NOT NULL,
  neighborhood varchar(100),
  host_company varchar(255) NOT NULL,
  host_email varchar(255) NOT NULL,
  host_context text,
  amenities jsonb NOT NULL,
  availability jsonb NOT NULL,
  monthly_rate integer NOT NULL,
  detailed_amenities jsonb,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE emails (
  id serial PRIMARY KEY,
  deal_id integer NOT NULL,
  from varchar(255) NOT NULL,
  to varchar(255) NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  sent_at timestamp DEFAULT now() NOT NULL,
  ai_generated boolean DEFAULT false,
  ai_metadata jsonb
);

CREATE TABLE deal_spaces (
  id serial PRIMARY KEY,
  deal_id integer NOT NULL,
  space_id integer NOT NULL,
  status varchar(50) NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE email_drafts (
  id serial PRIMARY KEY,
  deal_id integer NOT NULL,
  inbound_email_id integer NOT NULL,
  ai_generated_body text NOT NULL,
  edited_body text,
  final_body text,
  confidence_score integer NOT NULL,
  status varchar(50) DEFAULT 'pending' NOT NULL,
  reasoning jsonb,
  metadata jsonb,
  validation jsonb,  -- NEW: Self-critique validation results
  regeneration_count integer DEFAULT 0 NOT NULL,
  last_regeneration_at timestamp,
  current_version integer DEFAULT 0 NOT NULL,
  draft_versions jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  reviewed_at timestamp,
  reviewed_by varchar(255),
  sent_at timestamp,
  sent_email_id integer,
  archived_at timestamp,
  archived_by varchar(255),
  archive_reason text
);

-- Foreign Keys
ALTER TABLE deal_spaces
  ADD CONSTRAINT deal_spaces_deal_id_deals_id_fk
  FOREIGN KEY (deal_id) REFERENCES deals(id);

ALTER TABLE deal_spaces
  ADD CONSTRAINT deal_spaces_space_id_spaces_id_fk
  FOREIGN KEY (space_id) REFERENCES spaces(id);

ALTER TABLE emails
  ADD CONSTRAINT emails_deal_id_deals_id_fk
  FOREIGN KEY (deal_id) REFERENCES deals(id);

ALTER TABLE email_drafts
  ADD CONSTRAINT email_drafts_deal_id_deals_id_fk
  FOREIGN KEY (deal_id) REFERENCES deals(id);

ALTER TABLE email_drafts
  ADD CONSTRAINT email_drafts_inbound_email_id_emails_id_fk
  FOREIGN KEY (inbound_email_id) REFERENCES emails(id);

ALTER TABLE email_drafts
  ADD CONSTRAINT email_drafts_sent_email_id_emails_id_fk
  FOREIGN KEY (sent_email_id) REFERENCES emails(id);
```

### Drizzle Config Reference

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema.ts',      // Schema source of truth
  out: './drizzle',              // Migration output folder
  dialect: 'postgresql',         // Database type
  dbCredentials: {
    url: process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@127.0.0.1:54422/postgres',
  },
});
```

### Environment Variables

```bash
# .env.local
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54422/postgres
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
```

### Useful psql Commands

```bash
# Connect to database
psql postgresql://postgres:postgres@127.0.0.1:54422/postgres

# List all tables
\dt

# Describe table structure
\d email_drafts

# List all indexes
\di

# Show table sizes
\dt+

# Execute SQL file
\i backup.sql

# Export query to CSV
\copy (SELECT * FROM deals) TO 'deals.csv' CSV HEADER

# Show running queries
SELECT * FROM pg_stat_activity;

# Kill long-running query
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = 12345;

# Exit
\q
```

### Migration File Naming

Drizzle Kit auto-generates migration names:
- Format: `XXXX_adjective_noun.sql`
- Example: `0000_clear_sleepwalker.sql`
- Sequential numbering ensures order
- Descriptive names can be added: `npm run db:generate -- --name add_priority`

---

**Document Maintained By**: Ahn Ming Loke
**Related Documentation**:
- Frontend/Backend Architecture: `frontend_backend.md`
- Prompt Engineering (Technical): `prompt_engineering_technical.md`
- Prompt Engineering (Product): `prompt_engineering_product.md`
