# syntax=docker/dockerfile:1.7

# ---------- Étape 1 : base ----------
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

# ---------- Étape 2 : installation des dépendances (full, dev incluses) ----------
FROM base AS deps

# Manifestes du workspace racine (cache-friendly)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json turbo.json ./

# Manifeste de l'app cible
COPY apps/api/package.json apps/api/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @mytdfrik/api...

# ---------- Étape 3 : build ----------
FROM deps AS builder

COPY apps/api ./apps/api
RUN pnpm --filter @mytdfrik/api build

# ---------- Étape 4 : extraction du déploiement (deps prod uniquement) ----------
FROM builder AS deploy
RUN pnpm deploy --filter=@mytdfrik/api --prod /deploy

# ---------- Étape 5 : runtime ----------
FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Utilisateur non root
RUN addgroup -S app && adduser -S app -G app

COPY --from=deploy --chown=app:app /deploy/dist ./dist
COPY --from=deploy --chown=app:app /deploy/node_modules ./node_modules
COPY --from=deploy --chown=app:app /deploy/package.json ./

USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/main.js"]
