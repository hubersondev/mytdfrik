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

# URL publique de l'API : variable NEXT_PUBLIC_*, donc figée dans le bundle
# client au moment du build. Surchargée par docker-compose.prod.yml (build.args).
# La forme :- protège aussi contre un --build-arg passé vide (CI sans variable).
ARG NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3000/api/v1}

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

# 127.0.0.1 et non localhost : dans un conteneur Alpine, « localhost » résout
# aussi en ::1, or Next écoute sur 0.0.0.0 (IPv4 seul) — busybox wget tente
# l'IPv6, échoue, et Traefik écarte tout conteneur qui n'est pas « healthy ».
# La sonde vise /api/health, qui ne dépend pas de l'API NestJS : une panne du
# backend ne doit pas faire retirer le front des routeurs de Traefik.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3001/api/health || exit 1

CMD ["node", "apps/web/server.js"]
