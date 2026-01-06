# Echo Alpha - Frontend/Backend Architecture

Next.js 16 application providing an AI-powered email assistant for commercial real estate brokers. The application handles email thread analysis, AI draft generation with streaming UI, iterative refinement with version history, and transparent AI reasoning.

## Architecture Overview

The application follows a layered architecture that separates concerns:

```
User Interface (Pages & Components)
         ↓
    tRPC Hooks (Data Fetching)
         ↓
   tRPC Routers (API Layer)
         ↓
   Services (Business Logic)
         ↓
  Drizzle ORM (Database Layer)
         ↓
  PostgreSQL + External APIs (OpenAI, Resend)
```

## Key Concepts

### 1. **tRPC for Type-Safe APIs**
End-to-end type safety without code generation. Backend procedure types automatically flow to frontend hooks.

**Why tRPC?**
- No manual API client code
- Compile-time errors if API changes
- Full autocomplete in IDE
- Runtime validation with Zod
- Automatic request batching

**Location:**
- Server: `server/routers/` - API procedures
- Client: `lib/trpc.ts` - Client setup
- Provider: `lib/trpc-provider.tsx` - React Query integration

### 2. **Service Layer Pattern**
Services contain business logic and orchestrate multiple operations (database, external APIs, data transformation).

**Location:** `server/services/`
- `emailGenerator.ts` - OpenAI integration, prompt construction, reasoning extraction
- `draftValidator.ts` - Self-critique validation against CRM data (NEW)
- `contextBuilder.ts` - CRM data aggregation from multiple sources
- `emailSender.ts` - Resend integration, email formatting

### 3. **Version History System**
Drafts support iterative refinement with full version history and undo/redo.

**How it works:**
- Each draft stores versions in JSONB array
- 3 refinements per draft (free tier)
- 24-hour cooldown after limit
- Undo/redo switches between versions
- Auto-save before switching versions

**Location:**
- Backend: `server/routers/draft.ts` - `regenerate`, `switchVersion` procedures
- Frontend: `app/demo/components/VersionHistoryDrawer.tsx`

### 4. **Streaming UI Pattern**
Visual feedback during AI generation to show progress and build trust.

**Components:**
- **AIStatusIndicator** - 8-step progress (reading thread → querying CRM → drafting)
- **StreamingDraft** - Character-by-character text reveal (~50 chars/sec)

**Why streaming UI?**
- Simulated progress while real OpenAI API runs
- Keeps users engaged during 5-30 second wait
- Transparent about what AI is doing

**Location:** `app/demo/components/`

### 5. **AI Reasoning Transparency**
Every draft includes detailed reasoning showing what data was used and why.

**Data structure:**
```typescript
reasoning: {
  dataUsed: [
    {
      sourceType: 'space' | 'deal' | 'email',
      sourceName: string,
      details: { address, monthlyRate, amenities, ... },
      dataPointsUsed: ['parking availability', '24/7 access']
    }
  ],
  questionsAddressed: string[],
  schedulingLogic: string[],
  needsHumanReview: string[]
},
validation: {  // NEW
  status: 'passed' | 'warnings' | 'failed',
  issues: string[],
  checkedAt: Date
}
```

**Location:** `app/demo/components/AIInsightsDrawer.tsx`

## Data Flow

### Draft Generation Flow
```
User clicks "Generate Draft"
    ↓
tRPC mutation: draft.create
    ↓
Service: emailGenerator.generateEmailDraft()
    ↓
contextBuilder aggregates: deal + spaces + email thread
    ↓
OpenAI API call with structured prompt
    ↓
Validate draft against CRM data (NEW)
    ↓
Adjust confidence score based on validation (NEW)
    ↓
Parse response + extract reasoning
    ↓
Save draft with version 0 to database
    ↓
Return to frontend with full reasoning + validation
    ↓
Streaming UI reveals text character-by-character
```

### Refinement Flow
```
User enters refinement instruction
    ↓
Auto-save current edits
    ↓
tRPC mutation: draft.regenerate
    ↓
Check regeneration count (max 3)
    ↓
Service: emailGenerator.regenerateEmailDraft()
    ↓
OpenAI API with previous draft + instruction
    ↓
Create new version (v1, v2, or v3)
    ↓
Append to draftVersions array
    ↓
Update currentVersion pointer
    ↓
Return updated draft
    ↓
Frontend updates UI with new version
```

### Send Flow
```
User clicks "Send Email"
    ↓
Confirmation dialog (safety check)
    ↓
Auto-save any pending edits
    ↓
tRPC mutation: draft.send (confirmed: true)
    ↓
Service: emailSender.sendEmail()
    ↓
Resend API sends email
    ↓
Create email record in database
    ↓
Update draft status to 'sent'
    ↓
Frontend shows success + disables editing
```

## Project Structure

```
echo-alpha/
├── app/                          # Next.js App Router
│   ├── api/trpc/[trpc]/         # tRPC HTTP handler
│   ├── demo/                    # Single-page demo workflow (CEO demo)
│   │   ├── components/          # Demo-specific components
│   │   │   ├── AIStatusIndicator.tsx
│   │   │   ├── StreamingDraft.tsx
│   │   │   ├── AIInsightsDrawer.tsx
│   │   │   ├── VersionHistoryDrawer.tsx
│   │   │   ├── EditableDraft.tsx
│   │   │   └── EmailThreadItem.tsx
│   │   └── page.tsx             # Main demo page
│   ├── drafts/[id]/             # Legacy multi-page workflow
│   │   ├── components/
│   │   └── page.tsx
│   ├── overview/                # Landing page
│   ├── pricing/                 # Pricing tiers
│   └── layout.tsx               # Root layout (providers, nav)
│
├── components/                   # Reusable UI components
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── drawer.tsx
│   │   ├── textarea.tsx
│   │   └── icons/               # Lucide icon wrappers
│   ├── nav/                     # Navigation
│   └── layout/                  # Layout utilities
│
├── server/                       # Backend (tRPC + services)
│   ├── routers/                 # tRPC API endpoints
│   │   ├── _app.ts              # Router aggregator
│   │   ├── draft.ts             # Draft CRUD + refinement
│   │   └── deal.ts              # Deal queries
│   ├── services/                # Business logic
│   │   ├── emailGenerator.ts   # OpenAI integration
│   │   ├── draftValidator.ts   # Self-critique validation (NEW)
│   │   ├── contextBuilder.ts   # CRM data aggregation
│   │   └── emailSender.ts      # Resend integration
│   └── trpc.ts                  # tRPC initialization
│
├── lib/                          # Shared utilities
│   ├── trpc.ts                  # tRPC client
│   ├── trpc-provider.tsx        # React Query provider
│   ├── openai.ts                # OpenAI client
│   └── utils.ts                 # Helper functions
│
├── db/                           # Database layer
│   ├── schema.ts                # Drizzle schema
│   ├── index.ts                 # Database connection
│   └── seed.ts                  # Sample data
│
└── Makefile                      # Development commands
```

## Key Pages

### 1. Overview (`/overview`)
Landing page explaining the AI co-pilot value proposition.

**Key sections:**
- Problem: Brokers spend 80% of time on transactional work
- Solution: AI handles the 80%, human handles the 20%
- Demo scenario: Sarah's 12-question email (36 data points to look up)
- Time comparison: 45 min manual → 3 min AI-assisted (93% savings)

### 2. Demo (`/demo`)
Single-page interactive workflow (CEO demo).

**Workflow states:** `idle → generating → streaming → editing ⇄ refining → sent`

**Features:**
- Email thread display (collapsible, auto-expand latest)
- AI draft generation with simulated progress
- Streaming text reveal
- Editable draft with auto-save (2-second debounce)
- Version history with undo/redo
- AI insights drawer (shows CRM data used)
- Send confirmation + archive dialogs

### 3. Draft Detail (`/drafts/[id]`)
Legacy multi-page workflow for internal admin.

**Differences from demo:**
- Navigates away after actions (redirects to `/drafts` queue)
- No streaming UI
- Separate inbound email card
- Status-dependent action buttons (pending/approved/sent)
- Cooldown UI with upgrade CTA

### 4. Pricing (`/pricing`)
Pricing tiers with upgrade CTAs.

**Tiers:**
- Free: 3 refinements, 24-hour cooldown
- Professional: Unlimited refinements, no cooldown ($49/mo)
- Enterprise: Custom pricing, team features

## tRPC API Routes

### Draft Router (`draft.*`)

**Queries (read operations):**
- `getById` - Fetch single draft with full context
- `list` - Fetch drafts with filters (status, dealId)

**Mutations (write operations):**
- `create` - Generate initial draft from deal + email
- `update` - Save manual edits
- `regenerate` - Create new version with user instructions
- `switchVersion` - Undo/redo to previous version
- `send` - Send email via Resend (requires confirmation)
- `archive` - Soft delete (preserves for compliance)
- `approve` - Mark as reviewed
- `reject` - Reject or unapprove

### Deal Router (`deal.*`)

**Queries:**
- `getById` - Fetch deal details
- `getWithSpaces` - Fetch deal + associated spaces
- `getEmailThread` - Fetch all emails for a deal

## State Management

No global state library (Redux, Zustand). State is managed through:

1. **React hooks** - Local component state (`useState`, `useEffect`)
2. **URL params** - Draft ID passed via route params
3. **tRPC + React Query** - Server state with automatic caching
4. **Auto-save pattern** - Debounced saves on edit (2 seconds)

**Why no global state?**
- Application is primarily read-heavy
- tRPC + React Query handles server state
- Local state is sufficient for UI interactions
- Keeps complexity low

## Component Patterns

### shadcn/ui Components
Pre-built, accessible components based on Radix UI primitives.

**Used components:**
- `Button` - Primary actions, variants (outline, ghost)
- `Dialog` - Modal confirmations
- `Drawer` - Side panels (AI insights, version history)
- `Card` - Content containers
- `Badge` - Status indicators
- `Textarea` - Draft editing
- `Separator` - Visual dividers
- `Tabs` - Content switching

**Location:** `components/ui/`

### Custom Components

**Demo-specific:**
- `EmailThreadItem` - Gmail-style collapsible email cards
- `AIStatusIndicator` - 8-step progress with colored output
- `StreamingDraft` - Character-by-character text reveal
- `EditableDraft` - Textarea with auto-save indicator
- `DraftActionBar` - Action buttons (refine, send, view reasoning)
- `AIInsightsDrawer` - CRM data transparency
- `VersionHistoryDrawer` - Version list with undo/redo

**Draft detail components:**
- `DraftVersionHistory` - Version timeline
- `RegenerateDraftModal` - Refinement instruction input
- `EnhancedAIInsights` - Expandable reasoning cards

**Location:** `app/demo/components/`, `app/drafts/[id]/components/`

## Error Handling

### Server-Side Errors
```typescript
// Standard errors
throw new Error('Draft not found');

// Custom error codes (parsed on client)
throw new Error('COOLDOWN:24'); // 24 hours remaining
```

### Client-Side Error Handling
```typescript
const mutation = trpc.draft.send.useMutation({
  onError: (error) => {
    if (error.message.includes('COOLDOWN')) {
      const hours = error.message.split(':')[1];
      toast.error(`Wait ${hours} hours or upgrade`);
    } else {
      toast.error(error.message);
    }
  },
  onSuccess: () => {
    toast.success('Email sent!');
  },
});
```

## Styling

TailwindCSS 4 with custom design system.

**Key patterns:**
- Utility-first classes
- Custom colors via CSS variables
- Responsive design (mobile-first)
- Dark mode support (via `next-themes`)
- Animations via Motion library

**Brand colors:**
- Primary: `#FF2727` (red)
- Hover: `#000000` (black)

## Development Workflow

### Running locally
```bash
# Start Supabase + Next.js
make dev

# Fresh database (push schema + seed)
make db-fresh

# Check database status
make db-status

# Nuclear reset (destroys data)
make db-reset

# Stop all services
make clean
```

### Environment variables
```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54422/postgres
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...  # Optional
```

### Common tasks

**After schema changes:**
```bash
make db-fresh
```

**Database issues:**
```bash
make db-status    # Diagnose
make db-reset     # Nuclear option
```

## Design Decisions

### Why tRPC over REST?
- End-to-end type safety without code generation
- Automatic API client from server types
- Better DX with full autocomplete
- Reduces boilerplate significantly

### Why single-page demo workflow?
- CEO demo needs to feel seamless
- No jarring navigation away from context
- All actions (generate, edit, refine, send) in one place
- Better storytelling for value proposition

### Why streaming UI?
- OpenAI API takes 5-30 seconds
- Users need feedback during wait
- Builds trust by showing what AI is doing
- Creates "wow" factor for demo

### Why version history?
- Users want to iterate on AI output
- Undo/redo provides safety net
- 3-prompt limit creates upgrade path
- Transparent refinement process

### Why soft delete (archive)?
- Real estate emails are legal records
- Compliance requires audit trail
- Cannot permanently delete sent emails
- Archive preserves for future reference

## Common Patterns

### Fetching data in a page
```typescript
const { data: draft, isLoading } = trpc.draft.getById.useQuery({
  draftId
});

if (isLoading) return <LoadingSpinner />;
return <DraftContent draft={draft} />;
```

### Creating a mutation
```typescript
const sendMutation = trpc.draft.send.useMutation({
  onSuccess: () => {
    toast.success('Email sent!');
    router.push('/drafts');
  },
  onError: (error) => {
    toast.error(error.message);
  },
});

// Trigger mutation
sendMutation.mutate({ draftId, confirmed: true });
```

### Auto-save pattern
```typescript
const [editedBody, setEditedBody] = useState('');
const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

useEffect(() => {
  if (editedBody === originalBody) return;

  if (autoSaveTimer) clearTimeout(autoSaveTimer);

  const timer = setTimeout(() => {
    updateMutation.mutate({ draftId, editedBody });
  }, 2000); // 2-second debounce

  setAutoSaveTimer(timer);

  return () => clearTimeout(timer);
}, [editedBody]);
```

### Handling snake_case from database
```typescript
// Backend transforms snake_case to camelCase
getById: publicProcedure.query(async ({ ctx, input }) => {
  const row = await db.query.emailDrafts.findFirst(...);

  return {
    ...row,
    regenerationCount: row.regeneration_count,
    currentVersion: row.current_version,
    draftVersions: row.draft_versions,
  };
});
```

## Quick Reference

### Need to add a new tRPC procedure?
1. Define in `server/routers/draft.ts` or `server/routers/deal.ts`
2. Add input validation with Zod
3. Implement query/mutation logic
4. Use in frontend: `trpc.draft.yourProcedure.useQuery()` or `useMutation()`

### Need to modify AI generation?
- See `server/services/emailGenerator.ts`
- Prompt construction in `generateEmailDraft()`
- Reasoning extraction in response parsing

### Need to change CRM data aggregation?
- See `server/services/contextBuilder.ts`
- Modify `buildContext()` to include new data sources

### Need to add a new demo component?
1. Create in `app/demo/components/YourComponent.tsx`
2. Import in `app/demo/page.tsx`
3. Add to component hierarchy
4. Wire up state and handlers

### Need to debug tRPC issues?
- Check browser Network tab for `/api/trpc` calls
- Verify input matches Zod schema
- Check server console for errors
- Use React Query DevTools

### Need to debug auto-save?
- Check `editedBody` vs `draftBody` comparison
- Verify 2-second debounce timer
- Check mutation `isPending` state
- Look for toast notifications

---

**Related Documentation:**
- Database Schema: `db/schema.ts`
- Prompt Engineering (Technical): `docs/prompt_engineering_technical.md`
- Prompt Engineering (Product): `docs/prompt_engineering_product.md`
