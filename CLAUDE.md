# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sellermind is a SaaS platform for Amazon sellers — a multi-tenant dashboard covering order management, financial reporting (DRE), product/stock management, ads analytics, and billing. It integrates with Amazon SP-API, Amazon Ads API, Resend (email), and Eduzz (payments).

## Monorepo Structure

This is a **pnpm + Turborepo** monorepo:

- `apps/web/` — Main Next.js 15 app (App Router, Turbopack)
- `apps/landing/` — Landing/marketing site
- `packages/mongodb/` — Mongoose models (User, Store, Order, Product, Invoice, Expense, Subscription, Plan, Integration, StockMovement, AdsReport, etc.)
- `packages/ui/` — Shared Radix UI component library
- `packages/amazon-sp/` — Amazon Selling Partner API wrapper
- `packages/amazon-ads/` — Amazon Advertising API wrapper
- `packages/billing/` — Billing business logic
- `packages/redis/` — Redis client wrapper
- `packages/typescript-config/` — Shared `tsconfig`
- `packages/eslint-config/` — Shared ESLint config

## Commands

```bash
# Install dependencies
pnpm install

# Development (all apps with Turbopack)
pnpm dev

# Build all
pnpm build

# Build specific app
pnpm build:web
pnpm build:landing

# Type checking
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Start local infrastructure (MongoDB + Redis)
docker compose up -d
```

There are no test commands — the project has no test suite.

## Architecture

### Authentication Flow
- JWT tokens stored in cookies (not localStorage)
- `apps/web/middleware.ts` intercepts all requests, validates token, and redirects unauthenticated users to `/login`
- OTP-based login validation via `/otp-validation`
- `components/protected-route.tsx` and `components/subscription-guard.tsx` provide client-side guards

### API Layer
All backend logic lives in `apps/web/app/api/` as Next.js Route Handlers. The pattern is:
1. Route handler parses request, calls service functions
2. Services in `apps/web/services/` encapsulate business logic and external API calls
3. Mongoose models from `@workspace/mongodb` handle data persistence

### Amazon Integration
- `apps/web/lib/amazon-sp-client.ts` — SP-API client initialization
- `apps/web/lib/amazon-ads-client.ts` — Ads API client
- OAuth flows in `app/api/integrations/amazon-sp/` and `app/api/integrations/amazon-ads/`
- Access token refresh handled in `services/get-amazon-sp-access-token.ts`

### Data Fetching (Client Side)
- `hooks/use-api.ts` is the primary client-side HTTP wrapper using React Query
- API base URL from `NEXT_PUBLIC_API_URL`

### Environment Variables
Key vars expected in `apps/web/env/index.ts` (Zod-validated):
- `DATABASE_URL` — MongoDB connection string
- `JWT_SECRET` — Token signing key
- `REDIS_URL`
- `LWA_CLIENT_ID` / `LWA_CLIENT_SECRET` — Amazon Login with Amazon
- `SP_API_CLIENT_ID` / `SP_API_CLIENT_SECRET`
- `SP_APPLICATION_ID`
- `NEXT_PUBLIC_API_URL`
- `RESEND_API_KEY`

### Key Conventions
- Zod schemas in `apps/web/schemas/` for request validation
- DTOs in `apps/web/dtos/` for response shaping
- Email templates in `apps/web/templates/`
- `lib/mongoose.ts` manages connection pooling (singleton pattern for serverless)
- Multi-store support: users can have multiple Amazon stores; store context validated per-request via `lib/validate-store-from-request.ts`
