# Web App Dockerfile
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json  
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/mongodb/package.json ./packages/mongodb/package.json
COPY packages/redis/package.json ./packages/redis/package.json
COPY packages/amazon-ads/package.json ./packages/amazon-ads/package.json
COPY packages/amazon-sp/package.json ./packages/amazon-sp/package.json
COPY packages/billing/package.json ./packages/billing/package.json
COPY apps/web/package.json ./apps/web/package.json

# Copy .npmrc for proper configuration
COPY .npmrc ./

RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

# Copy source code of internal packages
COPY packages/ui ./packages/ui
COPY packages/eslint-config ./packages/eslint-config
COPY packages/typescript-config ./packages/typescript-config
COPY packages/mongodb ./packages/mongodb
COPY packages/redis ./packages/redis
COPY packages/amazon-ads ./packages/amazon-ads
COPY packages/amazon-sp ./packages/amazon-sp
COPY packages/billing ./packages/billing

# Copy the web app and root files
COPY apps/web ./apps/web
COPY turbo.json ./turbo.json
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Build the web app
RUN corepack enable pnpm && pnpm build:web

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
# set hostname to localhost
ENV HOSTNAME=0.0.0.0

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "apps/web/server.js"]