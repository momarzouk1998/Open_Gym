# ========================================
# Multi-stage Dockerfile for OpenGym
# Optimized for low-RAM servers (2GB)
# ========================================

# syntax=docker/dockerfile:1.7

# 1. Base
FROM node:20-alpine AS base
WORKDIR /app

# 2. Dependencies — separate layer for better caching
FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma
# Limit Node memory during install; generate Prisma client
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN npm ci --omit=dev=false && npx prisma generate

# 3. Builder — compile the Next.js app (most RAM-intensive step)
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Cap memory at 1.3GB so the 2GB droplet + swap doesn't OOM
ENV NODE_OPTIONS="--max-old-space-size=1280"
RUN npm run build

# 4. Runner (production) — tiny final image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Lower cap in production too
ENV NODE_OPTIONS="--max-old-space-size=512"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built standalone app (smaller than full build)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
