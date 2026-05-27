# ADR-002 — Bascule du backend de Laravel à NestJS

| Champ | Valeur |
|---|---|
| **Statut** | Accepté |
| **Date** | 2026-05-27 |
| **Décideur** | Département Développement TECHDIFRIK |
| **Référence projet** | CDC MyTDFRIK v0.3 (`docs/cdc/`) |
| **Supersedes** | [ADR-001](0001-stack-technique.md) (partiel — voir §Périmètre) |
| **Superseded by** | — |

## Contexte

L'ADR-001 avait acté le scénario « Laravel + Next.js » sur la base des compétences équipe existantes (PHP/Laravel + React/TypeScript) et d'un critère de productivité maximale.

Deux éléments nouveaux ont émergé après la décision initiale :

1. L'équipe dispose d'une **base de code NestJS existante** (boilerplate ou projet réutilisable) prête à être exploitée comme socle de départ.
2. L'équipe exprime explicitement la volonté de **monter en compétences sur NestJS / TypeScript full-stack**, en utilisant ce projet comme vecteur d'apprentissage.

Ces deux faits, qui n'étaient pas dans les données d'entrée de l'ADR-001, modifient l'arbitrage des critères :

- Le poids de la compétence Laravel diminue (équipe acceptant la transition).
- Le poids du démarrage rapide augmente grâce à la base NestJS existante (qui annule en partie le coût d'apprentissage initial).
- Le poids de la cohérence linguistique TypeScript front + back augmente (un seul langage, types partagés possibles).

## Périmètre

Cet ADR supersede **partiellement** l'ADR-001 :

| Décision ADR-001 | Statut dans ADR-002 |
|---|---|
| Frontend Next.js 15 + TypeScript + Tailwind + shadcn/ui | **Conservé** |
| Tests E2E Playwright | **Conservé** |
| PostgreSQL 16 managed Scaleway | **Conservé** |
| Redis 7 managed Scaleway | **Conservé** |
| Scaleway Object Storage | **Conservé** |
| SendGrid | **Conservé** |
| Sentry Cloud UE | **Conservé** |
| Hébergeur Scaleway (Paris) | **Conservé** |
| GitHub Actions | **Conservé** |
| **Backend Laravel 11** | **Remplacé par NestJS 11** |
| **ORM Eloquent** | **Remplacé par TypeORM 0.3+** |
| **WebSocket Laravel Reverb** | **Remplacé par `@nestjs/websockets` + Socket.io** |
| **Queue Laravel Queue** | **Remplacé par BullMQ via `@nestjs/bullmq`** |
| **Scheduler Laravel Scheduler** | **Remplacé par `@nestjs/schedule`** |
| **Tests Pest** | **Remplacé par Jest (intégré NestJS) + Supertest** |
| **Linter Laravel Pint** | **Remplacé par ESLint + Prettier (homogène avec front)** |
| **Hash bcrypt (Laravel natif)** | **Conservé** (`bcrypt` npm, coût 12) |
| **JWT via `php-open-source-saver/jwt-auth`** | **Remplacé par `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt`** |
| **Validation Laravel Requests** | **Remplacé par `class-validator` + `class-transformer` + DTOs** |
| **Antivirus ClamAV auto-hébergé** | **Conservé** (interfacé via clamd TCP) |
| **Mode opérationnel Laravel Forge** | **Remplacé par Docker Compose sur VPS** |

## Décision retenue

### Backend NestJS — composition détaillée

| Composant | Choix | Notes |
|---|---|---|
| Framework | **NestJS 11.1.16** (ou version de la base existante) | Architecture modulaire, DI, décorateurs. Express v5 par défaut depuis NestJS 11. Node.js ≥ 20 requis. |
| Runtime | **Node.js 22 LTS** | Couvre le minimum NestJS 11 (≥ 20) et Next.js 16 (≥ 20.9.0). En Maintenance LTS jusqu'à avril 2027. Bascule planifiée sur Node 24 LTS en octobre 2026 (passage en LTS Active). |
| Langage | **TypeScript strict** | `strict: true` dans `tsconfig.json`. |
| ORM | **TypeORM 0.3+** | Conformément à la base existante. Entités décorées, repositories, migrations natives. |
| Migrations DB | TypeORM migrations | `typeorm migration:generate` + `typeorm migration:run` dans la CI. |
| Authentification | `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt` | JWT court 15 min + refresh 7 jours glissants (CDC §9.3.1). |
| Hash mot de passe | `bcrypt` (npm) coût 12 | Conforme CDC §10.2.1. |
| Validation | `class-validator` + `class-transformer` | DTOs typés. `ValidationPipe` global. |
| WebSocket | `@nestjs/websockets` + adaptateur **Socket.io** | Auth WebSocket par JWT en handshake. Permet diffusion sélective vers `recipient_id`. |
| Queue | **BullMQ** via `@nestjs/bullmq` | Notifications, envoi courriels, scan antivirus, calcul SLA, exports CSV. |
| Scheduler / cron | `@nestjs/schedule` | Expirations de clôture, purge brouillons, alerte attente client > 30 j. |
| Mailing | **SendGrid SDK** (`@sendgrid/mail`) via service NestJS dédié | Templates externalisés (`templates/*.hbs`). |
| Documentation API | `@nestjs/swagger` | Spec OpenAPI 3.1 générée automatiquement (CDC §9.12). |
| Logging | **Pino** via `nestjs-pino` | JSON structuré, faible coût CPU (CDC §11.7.1). |
| Configuration | `@nestjs/config` + validation Joi/Zod | Charge `.env`, valide au démarrage, échec rapide si manquant. |
| Stockage S3 | `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` | URL pré-signées d'upload et de téléchargement. |
| Antivirus | Client `clamd` TCP (ex. `clamscan` ou `clamav.js`) | ClamAV en service Docker, exposé sur le réseau interne uniquement. |
| Cache | `@nestjs/cache-manager` + ioredis | Sessions WS, rate-limit, données chaudes. |
| Rate limit | `@nestjs/throttler` | Limites du CDC §9.10. |
| Métriques | `@willsoto/nestjs-prometheus` ou intégration OpenTelemetry | Métriques applicatives et métier (CDC §11.7.2). |
| Tests unitaires | **Jest** (intégré) | Mocking via `jest.mock` et `@nestjs/testing`. |
| Tests intégration / E2E | **Jest** + **Supertest** | Sur instance applicative avec base Postgres jetable (testcontainers). |
| Linter | **ESLint** (config NestJS) + **Prettier** | Aligné avec le frontend (un seul style). |
| Code formatter | Prettier | Configuration unique pour back et front. |
| Détection vulnérabilités | `npm audit` + Renovate | Conforme CDC §10.11. |

### Frontend Next.js — composition (versions affinées vs ADR-001)

| Composant | Choix |
|---|---|
| Framework | **Next.js 16.2.2** (App Router) — Node.js ≥ 20.9.0, TypeScript ≥ 5.1.0 requis |
| React | React 19 (peer dépendance) |
| Langage | TypeScript strict |
| Style | TailwindCSS + shadcn/ui |
| HTTP | TanStack Query + client OpenAPI généré depuis la spec NestJS |
| WebSocket client | `socket.io-client` (cohérent avec l'adaptateur côté serveur) |
| Tests unitaires | Vitest |
| Tests E2E | Playwright |

> **⚠️ Changement structurant Next.js 16 vs 15.** Le fichier `middleware.ts` est renommé en **`proxy.ts`** (et l'export nommé `middleware` → `proxy`). L'edge runtime n'est **plus supporté** dans `proxy` — le runtime est exclusivement `nodejs`. Si l'authentification ou d'autres préoccupations transverses utilisent un middleware, prévoir le naming `proxy` dès le départ. Codemod disponible : `npx @next/codemod upgrade major`.

**Cohérence des types entre back et front.** Le client TypeScript est généré depuis la spec OpenAPI émise par `@nestjs/swagger`, via `openapi-typescript` ou `orval` dans la CI front. Pour les DTOs partagés sans passer par OpenAPI, un package `@mytdfrik/shared-types` peut être extrait (monorepo).

### Structure de dépôt suggérée

Monorepo TurboRepo ou Nx pour exploiter la cohérence TypeScript :

```
mytechdfrik/
├── apps/
│   ├── api/           # NestJS (sur base existante)
│   └── web/           # Next.js
├── packages/
│   ├── shared-types/  # DTOs et énumérations partagées
│   └── eslint-config/ # Config ESLint commune
├── docker/
│   ├── docker-compose.yml         # Dev local
│   ├── docker-compose.prod.yml    # Prod
│   ├── docker-compose.staging.yml # Staging
│   └── traefik/
├── docs/
│   ├── cdc/
│   └── adr/
├── .github/workflows/
└── package.json       # workspaces
```

Alternative simple : deux dépôts séparés (`mytdfrik-api`, `mytdfrik-web`) si le monorepo est jugé prématuré.

### Opérations — Docker Compose sur VPS

#### Architecture cible

```
                         ┌──────────────┐
                  HTTPS  │   Traefik    │  (reverse proxy + Let's Encrypt)
        Internet ───────▶│   (Docker)   │
                         └──────┬───────┘
                                │
                ┌───────────────┼──────────────────┬────────────┐
                ▼               ▼                  ▼            ▼
          ┌──────────┐    ┌──────────┐       ┌──────────┐  ┌──────────┐
          │   web    │    │   api    │       │  api ws  │  │ clamav   │
          │ (Next.js)│    │ (NestJS) │       │ (NestJS) │  │  (clamd) │
          └──────────┘    └────┬─────┘       └────┬─────┘  └──────────┘
                               │                  │
                               ▼                  ▼
                         ┌──────────┐       ┌──────────┐
                         │PostgreSQL│       │  Redis   │
                         │ managed  │       │ managed  │
                         │(Scaleway)│       │(Scaleway)│
                         └──────────┘       └──────────┘
```

- **Traefik** comme reverse proxy (préféré à Nginx en environnement Docker Compose : auto-configuration via labels, Let's Encrypt natif).
- **PostgreSQL et Redis** : managed Scaleway en production (HA, backups), conteneurs en dev/staging.
- **NestJS API et WS** : peuvent être un seul service ou deux selon dimensionnement (au démarrage : un seul service exposant HTTP + WebSocket suffit).
- **ClamAV** : conteneur dédié sur le réseau interne Docker.

#### Topologie d'environnements

| Environnement | Cible |
|---|---|
| Dev local | Docker Compose complet (Postgres + Redis containers). |
| Staging | 1 VPS Scaleway DEV1-M (2 vCPU, 4 Go RAM) + Postgres/Redis managed mutualisés ou containerisés. |
| Production | 1 VPS Scaleway PRO2-S (4 vCPU, 16 Go RAM) ou GP1-XS, **Postgres et Redis managed Scaleway**. |

#### Pipeline CI/CD GitHub Actions

```
Pull Request:
  ├─ Lint (ESLint, Prettier)
  ├─ Type-check (tsc --noEmit)
  ├─ Tests unitaires (Jest, Vitest)
  ├─ Build images Docker (api, web)
  └─ Tests E2E sur compose éphémère

Push sur main → staging:
  ├─ Mêmes étapes que PR
  ├─ Push images vers ghcr.io
  ├─ SSH staging → docker compose pull && up -d
  └─ Migrations TypeORM appliquées

Tag release → production:
  ├─ Push images taguées vers ghcr.io
  ├─ Approbation manuelle
  ├─ SSH prod → docker compose pull && up -d
  ├─ Migrations (avec verrou applicatif)
  └─ Healthcheck + rollback automatique en cas d'échec
```

- Registre des images : **GitHub Container Registry** (`ghcr.io`), gratuit jusqu'à un seuil confortable pour ce volume.
- Secrets : variables d'environnement injectées via GitHub Actions et `.env` produit côté serveur (chiffré au repos sur le VPS).
- Gestion des secrets sensibles : **Doppler** ou **Vault**, ou simplement secrets GitHub Actions + sealed-secrets pour le MVP.

#### Stratégie de rollback

- Conserver les **3 dernières images** taguées en registre.
- `docker compose pull && docker compose up -d` avec image taguée précédente en cas d'incident.
- Migrations DB : toute migration destructive est réversible (au moins en deux temps déploiement applicatif + migration). En cas de rollback applicatif, la migration n'est pas réversible automatiquement ; toujours tester sur staging d'abord.

### Coût mensuel estimé révisé

| Poste | Montant |
|---|---|
| VPS prod Scaleway (PRO2-S, 4 vCPU, 16 Go) | ~ 50 €/mois |
| VPS staging Scaleway (DEV1-M, 2 vCPU, 4 Go) | ~ 15 €/mois |
| PostgreSQL Database for Scaleway (DB-DEV-S) | ~ 15 €/mois |
| Redis Database for Scaleway (DB-DEV-S) | ~ 12 €/mois |
| Scaleway Object Storage (cible 30 Go) | ~ 1 €/mois |
| SendGrid (Essentials) | 0-20 €/mois |
| Sentry (Developer / Team) | 0-25 €/mois |
| GitHub Container Registry | 0 € (free tier suffisant) |
| Nom de domaine | ~ 1 €/mois |
| **Total estimé** | **~ 100-140 €/mois** |

Légèrement supérieur à l'ADR-001 en raison du VPS prod plus généreux (Docker + plusieurs services + WebSocket) ; reste maîtrisé.

## Conséquences

### Positives

- **Cohérence linguistique** : un seul langage (TypeScript) du front au back. Types partageables via OpenAPI ou packages communs.
- **Base de code existante exploitable** : démarrage accéléré, validation indirecte que la stack tient la route.
- **Architecture modulaire NestJS** : DI claire, modules réutilisables, alignement naturel avec les frontières du domaine (Auth, Requests, Bugs, Notifications, etc.).
- **WebSocket natif** : `@nestjs/websockets` est de première classe, pas un add-on.
- **Conteneurisation dès le départ** : portabilité totale, environnement local identique à la prod, montée en compétences DevOps utile à long terme.
- **Tests intégrés** : Jest est livré avec NestJS, Supertest est trivial à mettre en route.
- **OpenAPI auto-généré** : la spec est issue du code, pas l'inverse. Moins de désynchronisation.

### Négatives / risques

- **Courbe d'apprentissage** : même avec une base existante, NestJS demande de la maîtrise (DI avancée, modules dynamiques, RxJS dans les interceptors). Plan de montée en compétences à formaliser.
- **Productivité initiale moindre** vs Laravel pour les opérations CRUD basiques — partiellement compensée par la base existante.
- **Docker Compose plutôt que Forge** : il faut maîtriser les bases Docker, networking de conteneurs, montage de volumes, configuration de Traefik. Davantage de fichiers à entretenir.
- **Charge mémoire serveur supérieure** : Node + plusieurs conteneurs nécessitent un VPS plus généreux qu'avec PHP-FPM seul.
- **Risque de prolifération de packages npm** : surveiller la chaîne de dépendances via `npm audit`, Renovate, Snyk.

### Mitigations

- **Plan de formation NestJS** sur 2-3 semaines en parallèle du début du projet, avec revue de code rapprochée par un sénior si disponible.
- **Couvrir la base NestJS existante par des tests** avant de la modifier, pour ne pas casser un socle non documenté.
- **`docker-compose.yml` lisible et documenté** : commentaires, conventions de nommage, README dédié `docker/README.md`.
- **Healthchecks** sur tous les services (`HEALTHCHECK` dans Dockerfile + endpoints `/api/v1/health` côté NestJS).
- **Lockfile committé** (`package-lock.json` ou `pnpm-lock.yaml`) et `npm ci` en CI pour déploiements reproductibles.

## Décisions liées

- Le **scaffold initial** doit partir de la base NestJS existante de l'équipe, augmentée des packages listés ci-dessus si manquants.
- Le **monorepo TurboRepo** (ou Nx) est suggéré mais reste à arbitrer au moment du scaffold (peut faire l'objet d'un ADR-003).
- Le choix **Traefik vs Nginx** côté reverse proxy peut être tranché au moment du scaffold (Traefik recommandé pour Docker Compose).

## Suivi

- Réévaluation 3 mois après le démarrage : adéquation de la stack avec la productivité réelle de l'équipe ; coût mémoire/CPU des conteneurs ; éventuelle nécessité d'extraire le service WS dans un conteneur séparé.
- Réévaluation 6 mois après MEP : passer ou non en Kubernetes managé (Kapsule) si la charge l'exige.
