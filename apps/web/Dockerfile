# syntax=docker/dockerfile:1.7

# ---------- Étape 1 : dépendances ----------
FROM node:22-alpine AS deps

RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/web/package.json apps/web/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @mytdfrik/web...

# ---------- Étape 2 : build ----------
FROM node:22-alpine AS builder

RUN corepack enable
WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY package.json pnpm-workspace.yaml tsconfig.base.json turbo.json ./
COPY apps/web ./apps/web

WORKDIR /repo/apps/web

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# ---------- Étape 3 : runtime ----------
FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

# Next.js produit un build standalone avec ses propres node_modules dans .next/standalone
COPY --from=builder --chown=app:app /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=app:app /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=app:app /repo/apps/web/public ./apps/web/public

USER app

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3001/ || exit 1

CMD ["node", "apps/web/server.js"]
