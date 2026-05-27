# syntax=docker/dockerfile:1.7

# ---------- Étape 1 : base ----------
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

# ---------- Étape 2 : installation des dépendances ----------
FROM base AS deps

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json turbo.json ./
COPY apps/web/package.json apps/web/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @mytdfrik/web...

# ---------- Étape 3 : build (hérite des deps, garde apps/web/node_modules) ----------
FROM deps AS builder

COPY apps/web ./apps/web

WORKDIR /repo/apps/web

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# ---------- Étape 4 : runtime (Next.js standalone output) ----------
FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

# Next.js standalone produit la structure monorepo : apps/web/server.js + node_modules adjacents.
COPY --from=builder --chown=app:app /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=app:app /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=app:app /repo/apps/web/public ./apps/web/public

USER app

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3001/ || exit 1

CMD ["node", "apps/web/server.js"]
