# MyTDFRIK

Plateforme web de gestion centralisée des demandes clients pour **TECHDIFRIK**.

> Statut : **en cours de développement** — Sprint 0 (Setup & socle).
> Référence projet : `CDC v0.3.1` (voir `docs/cdc/`).

## Documentation

- **Cahier des charges détaillé** : [docs/cdc/](docs/cdc/00-sommaire.md) — 13 chapitres + 4 annexes
- **Architecture Decision Records** : [docs/adr/](docs/adr/)
  - [ADR-001 — Stack technique (superseded)](docs/adr/0001-stack-technique.md)
  - [ADR-002 — Bascule du backend de Laravel à NestJS](docs/adr/0002-stack-backend-nestjs.md)
  - [ADR-003 — Monorepo TurboRepo + pnpm](docs/adr/0003-monorepo-turborepo.md)

## Stack technique

| Couche          | Technologie                                                                   |
| --------------- | ----------------------------------------------------------------------------- |
| Frontend        | Next.js 16.2.2 (App Router) + React 19 + TypeScript + TailwindCSS + shadcn/ui |
| Backend         | NestJS 11.1.16 + Node.js 22 LTS + TypeScript strict + TypeORM 0.3             |
| Base de données | PostgreSQL 16                                                                 |
| Cache / file    | Redis 7 + BullMQ                                                              |
| Stockage objet  | Scaleway Object Storage (S3-compatible)                                       |
| Temps réel      | Socket.io                                                                     |
| Courriel        | SendGrid                                                                      |
| Antivirus       | ClamAV                                                                        |
| Erreurs         | Sentry                                                                        |
| Hébergement     | Scaleway (Paris)                                                              |
| Opérations      | Docker Compose + Traefik                                                      |
| CI/CD           | GitHub Actions                                                                |

## Structure du dépôt

```
mytechdfrik/
├── apps/
│   ├── api/                  # Backend NestJS
│   └── web/                  # Frontend Next.js
├── packages/                 # Packages partagés
│   └── shared-types/         # DTOs et énumérations communes
├── docker/                   # Docker Compose + Dockerfiles
│   ├── docker-compose.yml
│   └── traefik/
├── docs/
│   ├── cdc/                  # Cahier des charges
│   ├── adr/                  # Decision records
│   └── retrospectives/       # Rétrospectives de sprint
├── .github/
│   └── workflows/            # GitHub Actions
├── package.json              # Workspace root
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

## Prérequis

- **Node.js** ≥ 22 (LTS) — voir `.nvmrc`
- **pnpm** ≥ 11 (activé via Corepack : `corepack enable && corepack prepare pnpm@latest --activate`)
- **Docker** + **Docker Compose** (pour les services Postgres / Redis / ClamAV en local)
- **Git** ≥ 2.40

## Démarrage local

```bash
# Installer les dépendances
pnpm install

# Démarrer les services (Postgres, Redis, ClamAV, Traefik)
docker compose -f docker/docker-compose.yml up -d

# Lancer l'API et le front en parallèle
pnpm dev
```

L'API est exposée sur `http://localhost:3000/api/v1` et l'interface web sur `http://localhost:3001`.

## Scripts utiles

| Commande         | Description                                 |
| ---------------- | ------------------------------------------- |
| `pnpm dev`       | Démarre tous les apps en mode développement |
| `pnpm build`     | Compile tous les apps                       |
| `pnpm lint`      | Lance ESLint sur tous les workspaces        |
| `pnpm typecheck` | Vérifie les types TypeScript                |
| `pnpm test`      | Exécute les tests unitaires                 |
| `pnpm test:e2e`  | Exécute les tests end-to-end                |
| `pnpm format`    | Formate le code avec Prettier               |

## Conventions

- **Conventional Commits** pour tous les messages de commit (`feat:`, `fix:`, `chore:`, etc.).
- **Branches** : trunk-based, `main` protégée, branches `feat/*`, `fix/*`, `chore/*`.
- **PR** : toute modification passe par une pull request avec CI verte avant merge.
- **Citation CDC** : référencer les exigences `[EXG-NN-XXX]` dans les commits et descriptions de PR.

## Licence

Propriété de TECHDIFRIK. Tous droits réservés.
