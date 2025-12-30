# Setup Instructions

## 1. Start Postgres Database
```bash
docker-compose up -d
```

Verify it's running:
```bash
docker ps
```

## 2. Install Dependencies
```bash
npm install
```

## 3. Push Database Schema
```bash
npm run db:push
```

## 4. Seed Database with Acme AI Scenario
```bash
npm run db:seed
```

## 5. Start Next.js Dev Server
```bash
npm run dev
```

## 6. Test the Stack

Visit: http://localhost:3000/demo

You should see:
- Email thread between Sarah (Acme AI) and the Tandem agent
- Confirmation that Docker → Postgres → Drizzle → tRPC → Next.js is working

## Troubleshooting

If Postgres connection fails:
```bash
# Check if container is running
docker ps

# View logs
docker logs echo-alpha-db

# Restart container
docker-compose down
docker-compose up -d
```

If seed fails:
```bash
# Check database connection
docker exec -it echo-alpha-db psql -U echo_alpha -d echo_alpha -c "\dt"
```

## What's Been Built

### Database Layer (`db/`)
- ✅ Schema with 4 tables: deals, spaces, emails, deal_spaces
- ✅ Database connection with Drizzle ORM
- ✅ Seed data for complete Acme AI scenario

### Backend Layer (`server/`)
- ✅ tRPC setup with typed procedures
- ✅ Deal router with 4 procedures:
  - `getById` - Get deal by ID
  - `getWithSpaces` - Get deal with associated spaces
  - `getEmailThread` - Get conversation history
  - `generateEmailDraft` - Generate AI email (mock for now)

### Frontend Layer (`app/`, `lib/`)
- ✅ Next.js App Router
- ✅ tRPC React Query integration
- ✅ Demo page showing email thread
- ✅ TRPCProvider wrapping app

### Infrastructure
- ✅ Docker Compose for Postgres
- ✅ Drizzle config and migrations
- ✅ TypeScript types throughout

## Next Steps (Tuesday 12/30)

1. Integrate real OpenAI API in `generateEmailDraft`
2. Create AI service (`services/ai-email-generator.ts`)
3. Build reasoning logic (scheduling, data lookups)
4. Wire AI service to tRPC mutation
5. Test end-to-end AI generation

## Monday EOD Goal: ✅ COMPLETE

- [x] Docker Postgres running
- [x] Schema created
- [x] Basic tRPC working
- [x] Can query DB from frontend
