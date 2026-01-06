# Echo Alpha

**AI-Powered Email Assistant for Commercial Real Estate**

> Automatically draft professional email responses in 30 seconds instead of 45 minutes. 90x efficiency improvement with transparent AI reasoning.

## What This Does

Echo Alpha analyzes complex client inquiries (e.g., 12 questions about 3 office spaces), automatically searches your CRM database, checks calendar availability, and generates accurate, personalized email responses. The AI shows exactly what data it used and why, enabling human verification before sending.

**Key Features:**
- 🤖 **AI Draft Generation** - GPT-4o-mini powered responses
- 🔍 **Transparent Reasoning** - See exactly what data the AI used
- ✏️ **Iterative Refinement** - Refine drafts with natural language
- 📝 **Version History** - Full undo/redo with Cmd+Z/Cmd+Shift+Z
- ✅ **Human-in-the-Loop** - Review and approve before sending
- 📊 **Compliance Ready** - Complete audit trail

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React, TailwindCSS, shadcn/ui
- **Backend:** tRPC, Drizzle ORM
- **Database:** PostgreSQL (Supabase local)
- **AI:** OpenAI GPT-4o-mini

## Quick Start

### Prerequisites

- Node.js 21+
- Docker (for Supabase local)
- Make (usually pre-installed on Mac/Linux)

### Development Setup

```bash
# Install dependencies
npm install

# Start everything (Supabase + Next.js)
make dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## Available Commands

Run `make help` to see all available commands:

### Core Commands

- **`make dev`** - Start Supabase + Next.js dev server
- **`make db-fresh`** - Quick database refresh (push schema + seed data)
- **`make db-reset`** - Nuclear reset (clean volumes + fresh start) ⚠️ *requires confirmation*
- **`make db-status`** - Check Supabase health and database state
- **`make clean`** - Stop all services

### Database Commands

- **`make db-push`** - Push schema changes to database
- **`make db-seed`** - Seed database with sample data

## Common Workflows

### First Time Setup

```bash
make dev          # Starts Supabase and Next.js
# In another terminal:
make db-fresh     # Creates tables and seeds data
```

### After Schema Changes

```bash
make db-fresh     # Push new schema and reseed
```

### Database Issues?

```bash
make db-status    # Check what's wrong
make db-reset     # Nuclear option (destroys all data)
```

### Daily Development

```bash
make dev          # Just start the dev server
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Demo Page    │  │ Streaming    │  │ AI Reasoning │      │
│  │ /demo        │  │ Draft UI     │  │ Drawer       │      │
│  └──────┬───────┘  └──────────────┘  └──────────────┘      │
│         │ tRPC Mutations                                     │
│         ▼                                                    │
├─────────────────────────────────────────────────────────────┤
│                Backend (tRPC + Drizzle ORM)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ draft.ts Router                                       │  │
│  │  • create()  • regenerate()  • send()  • archive()   │  │
│  └────────┬─────────────────────────────────────────────┘  │
│           ▼                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ emailGenerator.ts Service                             │  │
│  │  • generateEmailDraft()  • analyzeEmailDraft()       │  │
│  └────────┬─────────────────────────────────────────────┘  │
│           ▼                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ OpenAI API (GPT-4o-mini)                             │  │
│  │  Temperature: 0.7  |  Max Tokens: 1000               │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│              Database (PostgreSQL via Supabase)              │
│  email_drafts | emails | spaces | deals | deal_spaces      │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── demo/              # Main demo workflow (CEO demo)
│   ├── drafts/            # Draft review pages
│   └── overview/          # Landing page
├── components/            # Reusable UI components
├── db/                    # Database schema and migrations
│   ├── schema.ts          # Drizzle schema definitions
│   └── seed.ts            # Sample data seeder
├── server/                # tRPC backend
│   ├── routers/           # API route handlers
│   └── services/          # Business logic (AI, email, context)
├── docs/                  # Technical documentation
│   ├── prompt_engineering_technical.md
│   └── prompt_engineering_product.md
├── EXECUTIVE_SUMMARY.md   # Business overview for stakeholders
└── Makefile              # Development workflow commands
```

## Environment Variables

Create a `.env.local` file with:

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54422/postgres
OPENAI_API_KEY=your_key_here
```

## Troubleshooting

### Database not working?

```bash
make db-status    # See what's wrong
make db-reset     # Start fresh (destroys data!)
```

### Supabase containers unhealthy?

```bash
make clean
make dev
make db-fresh
```

### Port 3000 already in use?

```bash
# Kill the process
lsof -ti:3000 | xargs kill -9
make dev
```
