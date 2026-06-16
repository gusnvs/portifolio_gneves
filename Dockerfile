# syntax=docker/dockerfile:1

# ---------- base ----------
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
# OpenSSL is needed by some build tooling
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---------- install + build ----------
FROM base AS builder
# Manifests first for better layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/
COPY apps/video/package.json ./apps/video/
RUN pnpm install --frozen-lockfile

# Source
COPY . .

# Generate the Prisma client and build the standalone Next server
RUN pnpm --filter web exec prisma generate
RUN pnpm --filter web build

# ---------- migrator (one-shot: applies DB migrations) ----------
FROM builder AS migrator
WORKDIR /app/apps/web
CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

# ---------- runner (small standalone server) ----------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

# Standalone output mirrors the monorepo layout
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
