# Echo Alpha

AI-powered email assistant demo for commercial real estate brokers.

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

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── demo/              # Demo flow pages
│   ├── drafts/            # Email draft review pages
│   └── overview/          # Landing page
├── components/            # Reusable UI components
├── db/                    # Database schema and migrations
│   ├── schema.ts          # Drizzle schema definitions
│   └── seed.ts            # Sample data seeder
├── server/                # tRPC backend
│   ├── routers/           # API route handlers
│   └── services/          # Business logic
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
