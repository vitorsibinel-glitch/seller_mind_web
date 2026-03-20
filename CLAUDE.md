# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sellermind is a SaaS platform for Amazon sellers. It's a pnpm monorepo managed by Turborepo with two Next.js 15 apps and several shared packages.

## Commands

```bash
# Development (starts all apps with turbopack)
pnpm dev

# Build
pnpm build              # all apps
pnpm build:web          # web app only
pnpm build:landing      # landing page only

# Quality checks
pnpm lint               # lint all packages
pnpm typecheck          # type-check all packages
pnpm format             # prettier formatting

# Local infrastructure
docker compose up -d    # MongoDB (27017) + Redis (6379)

# Clean everything
pnpm clean              # removes turbo cache and node_modules
```

No test framework is configured yet.

## Architecture

### Monorepo Layout

- **apps/web** — Main Next.js 15 dashboard app (App Router, React 19). Amazon seller dashboard with multi-store management, finances, analytics, subscriptions, and gamification.
- **apps/landing** — Marketing landing page (Next.js 15).
- **packages/mongodb** — Mongoose models and `connectMongo()` singleton. ~17 models (User, Store, Product, Order, Subscription, BillingAccount, Integration, etc.).
- **packages/redis** — Redis client factory (`createRedisClient()`) using ioredis.
- **packages/billing** — Billing service (subscription management, checkout via Eduzz).
- **packages/amazon-sp** — Amazon Selling Partner API wrapper.
- **packages/amazon-ads** — Amazon Ads API client (axios-based).
- **packages/ui** — Shared React component library (shadcn/ui + Radix UI + TailwindCSS 4).
- **packages/eslint-config** — Shared ESLint configs (`library.js`, `next.js`, `react-internal.js`).
- **packages/typescript-config** — Shared tsconfig bases (`base.json`, `nextjs.json`, `react-library.json`).

### Key Patterns (Web App)

- **Auth**: JWT (HS256) with email + OTP login flow. Middleware (`apps/web/middleware.ts`) validates tokens and injects `userId` header. Cookies store JWT.
- **API routes**: Next.js App Router handlers under `apps/web/app/api/`. Database routes use a `withDB()` wrapper for connection/error handling.
- **State**: Zustand for client-side global state, TanStack React Query for server state, `GlobalFilterContext` for period/store filters.
- **Schemas**: Zod validation schemas in `apps/web/schemas/`.
- **DTOs**: Data transfer objects in `apps/web/dtos/`.
- **Services**: Business logic in `apps/web/services/` (Amazon token management, orders, inventory, ads metrics, OTP, stats).
- **Env validation**: Zod schema validates environment variables with defaults for build-time safety.

### External Integrations

Amazon SP-API, Amazon Ads API, Resend (email), Eduzz (checkout/billing), DIG2PAY (payments).

### Tech Stack Highlights

pnpm 10.4 · Node >= 20 · Next.js 15.4 · React 19 · TypeScript (strict) · MongoDB/Mongoose · Redis/ioredis · BullMQ · TailwindCSS 4 · Zod · React Hook Form · argon2 · jose/jsonwebtoken · Winston logging
