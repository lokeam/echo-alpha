.PHONY: help dev db-fresh db-reset db-push db-seed db-status clean

# Colors for terminal output
GREEN  := \033[0;32m
RED    := \033[0;31m
YELLOW := \033[0;33m
BLUE   := \033[0;34m
RESET  := \033[0m

# Database connection (from Supabase local)
DB_URL := postgresql://postgres:postgres@127.0.0.1:54422/postgres

# Default target - show help
help:
	@echo "$(BLUE)Available commands:$(RESET)"
	@echo ""
	@echo "  $(GREEN)make dev$(RESET)          - Start Supabase + Next.js dev server"
	@echo "  $(GREEN)make db-fresh$(RESET)     - Quick reset: push schema + seed data"
	@echo "  $(GREEN)make db-reset$(RESET)     - Nuclear reset: clean volumes + fresh start (requires confirmation)"
	@echo "  $(GREEN)make db-status$(RESET)    - Check Supabase health and database state"
	@echo "  $(GREEN)make db-push$(RESET)      - Push schema changes to database"
	@echo "  $(GREEN)make db-seed$(RESET)      - Seed database with sample data"
	@echo "  $(GREEN)make clean$(RESET)        - Stop all services"
	@echo ""

# Start development environment
dev:
	@echo "$(BLUE)Starting development environment...$(RESET)"
	@echo "$(YELLOW)Starting Supabase (this may take a moment)...$(RESET)"
	@npx supabase start --ignore-health-check > /dev/null 2>&1 || npx supabase start --ignore-health-check
	@echo "$(GREEN)✓ Supabase started$(RESET)"
	@echo "$(YELLOW)Starting Next.js dev server...$(RESET)"
	@npm run dev

# Quick database refresh (no confirmation needed)
db-fresh:
	@echo "$(BLUE)Refreshing database...$(RESET)"
	@echo "$(YELLOW)Pushing schema changes...$(RESET)"
	@npm run db:push
	@echo "$(GREEN)✓ Schema pushed$(RESET)"
	@echo "$(YELLOW)Seeding database...$(RESET)"
	@npm run db:seed
	@echo "$(GREEN)✓ Database refreshed successfully$(RESET)"

# Nuclear database reset (requires confirmation)
db-reset:
	@echo "$(RED)⚠️  WARNING: This will destroy all local database data!$(RESET)"
	@echo "$(YELLOW)This will:$(RESET)"
	@echo "  - Stop Supabase"
	@echo "  - Remove Docker volumes"
	@echo "  - Start fresh Supabase instance"
	@echo "  - Push schema"
	@echo "  - Seed sample data"
	@echo ""
	@read -p "Continue? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(YELLOW)Stopping Supabase...$(RESET)"; \
		npx supabase stop > /dev/null 2>&1 || true; \
		echo "$(GREEN)✓ Supabase stopped$(RESET)"; \
		echo "$(YELLOW)Cleaning Docker volumes...$(RESET)"; \
		docker volume ls --filter label=com.supabase.cli.project=echo-alpha -q | xargs -r docker volume rm > /dev/null 2>&1 || true; \
		echo "$(GREEN)✓ Volumes cleaned$(RESET)"; \
		echo "$(YELLOW)Starting fresh Supabase instance...$(RESET)"; \
		npx supabase start --ignore-health-check; \
		echo "$(GREEN)✓ Supabase started$(RESET)"; \
		echo "$(YELLOW)Pushing schema...$(RESET)"; \
		npm run db:push; \
		echo "$(GREEN)✓ Schema pushed$(RESET)"; \
		echo "$(YELLOW)Seeding database...$(RESET)"; \
		npm run db:seed; \
		echo "$(GREEN)✓ Database reset complete!$(RESET)"; \
	else \
		echo "$(YELLOW)Reset cancelled$(RESET)"; \
	fi

# Push schema changes only
db-push:
	@echo "$(BLUE)Pushing schema changes...$(RESET)"
	@npm run db:push
	@echo "$(GREEN)✓ Schema pushed$(RESET)"

# Seed database only
db-seed:
	@echo "$(BLUE)Seeding database...$(RESET)"
	@npm run db:seed
	@echo "$(GREEN)✓ Database seeded$(RESET)"

# Check database status
db-status:
	@echo "$(BLUE)Checking database status...$(RESET)"
	@echo ""
	@echo "$(YELLOW)Supabase Status:$(RESET)"
	@if npx supabase status > /dev/null 2>&1; then \
		echo "  $(GREEN)✓ Supabase is running$(RESET)"; \
		npx supabase status | grep -E "(Local|Database)" || true; \
	else \
		echo "  $(RED)✗ Supabase is not running$(RESET)"; \
		echo "  Run: $(BLUE)make dev$(RESET) or $(BLUE)npx supabase start$(RESET)"; \
		exit 0; \
	fi
	@echo ""
	@echo "$(YELLOW)Database Tables:$(RESET)"
	@if psql "$(DB_URL)" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" 2>/dev/null | grep -q "deals\|emails\|spaces"; then \
		echo "  $(GREEN)✓ Tables exist$(RESET)"; \
		psql "$(DB_URL)" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" 2>/dev/null | grep -E "deals|emails|spaces|deal_spaces|email_drafts" || true; \
	else \
		echo "  $(RED)✗ Tables missing$(RESET)"; \
		echo "  Run: $(BLUE)make db-fresh$(RESET) to create tables and seed data"; \
		exit 0; \
	fi
	@echo ""
	@echo "$(YELLOW)Sample Data:$(RESET)"
	@EMAIL_COUNT=$$(psql "$(DB_URL)" -t -c "SELECT COUNT(*) FROM emails WHERE deal_id = 1;" 2>/dev/null | xargs); \
	if [ "$$EMAIL_COUNT" -gt 0 ] 2>/dev/null; then \
		echo "  $(GREEN)✓ Database has data ($$EMAIL_COUNT emails)$(RESET)"; \
	else \
		echo "  $(YELLOW)⚠ Database is empty$(RESET)"; \
		echo "  Run: $(BLUE)make db-seed$(RESET) to add sample data"; \
	fi
	@echo ""

# Stop all services
clean:
	@echo "$(BLUE)Stopping all services...$(RESET)"
	@echo "$(YELLOW)Stopping Supabase...$(RESET)"
	@npx supabase stop > /dev/null 2>&1 || true
	@echo "$(GREEN)✓ All services stopped$(RESET)"
