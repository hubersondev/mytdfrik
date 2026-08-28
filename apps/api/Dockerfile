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
# --legacy : comportement pré-v10. Adapté tant qu'aucun package interne (@mytdfrik/*)
# n'est consommé par l'API. À remplacer par 'inject-workspace-packages: true' dans
# pnpm-workspace.yaml quand le premier package interne sera introduit (S3).
RUN pnpm deploy --filter=@mytdfrik/api --prod --legacy /deploy

# ---------- Étape 5 : runtime ----------
FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Utilisateur non root
RUN addgroup -S app && adduser -S app -G app

COPY --from=deploy --chown=app:app /deploy/dist ./dist
COPY --from=deploy --chown=app:app /deploy/node_modules ./node_modules
COPY --from=deploy --chown=app:app /deploy/package.json ./

# Dossier des pièces jointes (STORAGE_DRIVER=local). Créé avant le montage pour
# qu'un volume Docker attaché à cet emplacement hérite des droits de `app`.
RUN mkdir -p /app/.storage && chown app:app /app/.storage

USER app

EXPOSE 3000

# 127.0.0.1 et non localhost : dans un conteneur Alpine, « localhost » résout
# aussi en ::1, or Node écoute sur 0.0.0.0 (IPv4 seul) — busybox wget tente
# l'IPv6, échoue, et Traefik écarte tout conteneur qui n'est pas « healthy ».
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/api/v1/health || exit 1

CMD ["node", "dist/main.js"]
