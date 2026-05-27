# syntax=docker/dockerfile:1.7

# ---------- Étape 1 : build ----------
FROM node:22-alpine AS builder

RUN corepack enable

WORKDIR /repo

# Manifestes du workspace racine
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* tsconfig.base.json ./
COPY turbo.json ./

# Manifeste de l'app
COPY apps/api/package.json apps/api/

# Installer toutes les dépendances du workspace (cache friendly)
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Sources et build
COPY apps/api ./apps/api
WORKDIR /repo/apps/api
RUN pnpm build

# Prune des devDependencies pour l'image finale
WORKDIR /repo
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm prune --prod --filter @mytdfrik/api

# ---------- Étape 2 : runtime ----------
FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Utilisateur non root (sécurité)
RUN addgroup -S app && adduser -S app -G app

COPY --from=builder --chown=app:app /repo/apps/api/dist ./dist
COPY --from=builder --chown=app:app /repo/apps/api/package.json ./
COPY --from=builder --chown=app:app /repo/node_modules ./node_modules

USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/main.js"]
