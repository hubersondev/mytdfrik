# ADR-003 — Monorepo TurboRepo + pnpm workspaces

| Champ | Valeur |
|---|---|
| **Statut** | Accepté |
| **Date** | 2026-05-27 |
| **Décideur** | Département Développement TECHDIFRIK |
| **Référence projet** | CDC MyTDFRIK v0.3.1 (`docs/cdc/`) |
| **Supersedes** | — |
| **Superseded by** | — |

## Contexte

L'[ADR-002](0002-stack-backend-nestjs.md) suggère un monorepo TurboRepo ou Nx pour exploiter la cohérence TypeScript entre le backend NestJS et le frontend Next.js, mais laisse le choix précis ouvert. Au démarrage du Sprint 0, cette décision doit être tranchée pour orienter le scaffold initial.

Deux options principales étaient envisagées :

1. **Monorepo TurboRepo** + pnpm workspaces.
2. **Monorepo Nx** + npm/pnpm.

Une troisième voie — **deux dépôts séparés** — a été écartée d'emblée : la cohérence des types entre back et front via OpenAPI, le partage de configurations (ESLint, Prettier, tsconfig), et l'unicité de la pipeline CI/CD justifient un monorepo pour ce projet à un développeur.

## Critères de décision

| Critère | Poids | TurboRepo | Nx |
|---|---|---|---|
| Courbe d'apprentissage | 4 | ★★★★★ (config JSON simple) | ★★★ (générateurs, plugins, console) |
| Adéquation à 2 apps (api + web) | 5 | ★★★★★ | ★★★★ (overkill pour 2 apps) |
| Performance (cache local, remote) | 4 | ★★★★★ | ★★★★★ |
| Indépendance vis-à-vis d'un éditeur | 3 | ★★★★ (Vercel) | ★★★ (Nrwl, plus de lock-in) |
| Documentation et écosystème NestJS/Next.js | 4 | ★★★★★ | ★★★★ |
| Outillage natif pour Docker multi-stage | 3 | ★★★★ | ★★★ |
| Compatibilité pnpm workspaces | 5 | ★★★★★ | ★★★★ |

## Décision

**TurboRepo + pnpm workspaces.**

Justification synthétique :

- **Productivité immédiate** : configuration JSON minimale, pas de génération automatisée à apprendre. Le développeur solo peut piloter le monorepo sans ouvrir la documentation à chaque tâche.
- **Cas d'usage parfait** : 2 apps + quelques packages partagés tombent dans la zone de confort idéale de TurboRepo. Nx brille quand il y a 10+ apps et un système de plugins riche, ce qui n'est pas notre cas.
- **pnpm** : déjà arbitré dans ADR-002. Compatibilité native avec TurboRepo, performance de l'installation (hoisting strict), économie d'espace disque.
- **Soutien actif** : TurboRepo est maintenu par Vercel (même éditeur que Next.js), donc l'intégration Next.js est de première classe.

## Structure du dépôt

```
mytechdfrik/
├── apps/
│   ├── api/                  # @mytdfrik/api — Backend NestJS
│   │   ├── src/
│   │   ├── test/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json     # étend ../../tsconfig.base.json
│   │   └── .env.example
│   └── web/                  # @mytdfrik/web — Frontend Next.js
│       ├── src/
│       ├── public/
│       ├── Dockerfile
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.ts
│       └── .env.example
├── packages/                 # Packages partagés (créés à la demande)
│   └── shared-types/         # @mytdfrik/shared-types — DTOs et énumérations
├── docker/                   # Docker Compose + configs déploiement
├── docs/
│   ├── cdc/                  # Cahier des charges
│   ├── adr/                  # Decision records
│   └── retrospectives/       # Rétrospectives de sprint
├── .github/
│   ├── workflows/            # Pipelines CI/CD
│   └── pull_request_template.md
├── package.json              # Workspace root (scripts globaux turbo)
├── pnpm-workspace.yaml       # Déclaration des workspaces
├── turbo.json                # Configuration Turbo (tâches, cache)
├── tsconfig.base.json        # Config TS partagée
├── .prettierrc               # Style commun
├── .editorconfig
├── .nvmrc                    # Node 22
├── .gitignore
└── README.md
```

## Conventions de nommage

- **Packages** : préfixe `@mytdfrik/` (scope NPM privé). Exemples : `@mytdfrik/api`, `@mytdfrik/web`, `@mytdfrik/shared-types`.
- **Scripts par app** : chaque `package.json` d'app expose au minimum `build`, `dev`, `lint`, `lint:fix`, `typecheck`, `test`, `clean`. La racine orchestre via Turbo (`pnpm dev`, `pnpm build`, etc.).
- **TypeScript** : chaque app étend `tsconfig.base.json` à la racine (mode strict, target ES2023, NodeNext).
- **Versions** : toutes les apps et packages restent en `0.0.0` jusqu'à la première release. Pas de SemVer interne entre packages — un seul tag global au moment de la mise en production.

## Cache Turbo

- **Cache local** : activé par défaut dans `.turbo/`, ignoré par git.
- **Cache distant** (Turborepo Remote Cache) : non activé au MVP, peut être configuré plus tard via Vercel Remote Cache si une équipe partagée le justifie.
- **Tâches mises en cache** : `build`, `lint`, `test`, `typecheck`. La tâche `dev` est marquée `cache: false` (persistante).

## Pipeline CI/CD

GitHub Actions (`.github/workflows/ci.yml`) exécute en parallèle :

1. **Job `lint-and-typecheck`** : `pnpm format:check && pnpm lint && pnpm typecheck`.
2. **Job `test`** : `pnpm test` (Jest pour l'API, Vitest pour le frontend quand activé).
3. **Job `build`** : build des deux images Docker via `docker/build-push-action`, push vers `ghcr.io` uniquement sur `push` vers `main`.

Le cache Turbo n'est pas partagé en CI au MVP (peut être ajouté si les durées deviennent gênantes).

## Outillage des dépendances

- **Renovate** ou **Dependabot** à activer dès la création du dépôt distant — mises à jour groupées par écosystème (Node deps, GitHub Actions, Docker images), exécution hebdomadaire (CDC §10.11 [EXG-10-192]).
- **pnpm audit** en CI à chaque build pour détecter les vulnérabilités connues des dépendances.

## Conséquences

### Positives

- Configuration JSON simple, courbe d'apprentissage minime pour un développeur solo.
- Tâches parallélisées avec cache → builds rapides en local et en CI.
- Cohérence linguistique (TypeScript partout) renforcée par les packages partagés (`@mytdfrik/shared-types` à créer en S3 quand les premiers DTOs émergeront).
- Préparation propre pour ajouter de futurs packages (jobs, mobile app éventuelle, etc.) sans refonte.

### Négatives / risques

- **Turbo est un produit Vercel** : risque de lock-in à long terme. Mitigation : la couche d'orchestration (`turbo.json`) est remplaçable par Nx ou des scripts npm sans refonte de la structure des packages.
- **pnpm hoisting strict** : peut révéler des problèmes de peer dependencies cachés par npm/yarn. Mitigation : `onlyBuiltDependencies` configuré dans `pnpm-workspace.yaml` pour les packages avec scripts natifs (`bcrypt`, `@swc/core`, `@nestjs/core`).
- **Docker multi-stage avec pnpm** : nécessite la copie sélective de `pnpm-workspace.yaml` et `pnpm-lock.yaml` pour profiter du cache. Le `Dockerfile` de chaque app respecte cette convention.

### Décisions liées

- L'extraction d'un package `@mytdfrik/shared-types` est planifiée pour le Sprint 3 quand les premiers DTOs partagés (Demande, Catégorie, Priorité) émergeront. Inutile de le créer dès le S0.
- L'éventuel passage à Nx peut être réévalué en V1.1 si le projet atteint > 5 apps ou si une équipe de 3+ développeurs prend en charge le code.

## Suivi

- Réévaluation 3 mois après le démarrage du MVP : durée des CI, pertinence du cache, ergonomie pour les ajouts de packages.
