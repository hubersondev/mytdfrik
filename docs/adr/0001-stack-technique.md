# ADR-001 — Stack technique

| Champ | Valeur |
|---|---|
| **Statut** | **Superseded** |
| **Date** | 2026-05-27 |
| **Décideur** | Département Développement TECHDIFRIK |
| **Référence projet** | CDC MyTDFRIK v0.2 (`docs/cdc/`) |
| **Supersedes** | — |
| **Superseded by** | [ADR-002](0002-stack-backend-nestjs.md) (partiel — voir §Périmètre de l'ADR-002) |

> **⚠️ Cet ADR est superseded.** Le backend Laravel a été remplacé par NestJS suite à deux éléments nouveaux : une base de code NestJS existante côté équipe, et une volonté explicite de montée en compétences TypeScript full-stack. Les décisions relatives au frontend, à la base de données, au stockage, au courriel et à l'hébergeur **restent valides** (héritées par l'ADR-002). Voir [ADR-002](0002-stack-backend-nestjs.md) pour la décision en vigueur.
>
> Cet ADR-001 est conservé pour traçabilité — il documente le contexte initial et les critères qui ont fait pencher la décision avant le changement.

## Contexte

La note de cadrage MyTDFRIK v1.1 (mai 2026) propose plusieurs stacks alternatives pour la plateforme : Next.js ou Nuxt côté frontend, NestJS / Laravel / Django côté backend, AWS / OVH / Scaleway côté hébergement. Le cahier des charges v0.1 a consolidé ces options dans l'[annexe A2](../cdc/annexes/A2-comparaison-stacks.md) sous trois scénarios cohérents :

1. Scénario 1 — TypeScript full-stack (Next.js + NestJS).
2. Scénario 2 — PHP éprouvé (Next.js ou Nuxt + Laravel).
3. Scénario 3 — Python orienté data (Next.js + Django).

L'équipe doit choisir une stack avant le démarrage de la réalisation. Les choix structurants conditionnent ensuite l'écriture des migrations, du squelette applicatif et du pipeline CI/CD.

## Critères de décision

Quatre critères ont été utilisés pour discriminer les scénarios :

| Critère | Poids | Raison |
|---|---|---|
| Compétences réelles de l'équipe | 5 | Une équipe productive sur une stack moins moderne battra toujours une équipe en apprentissage sur une stack moderne. |
| Capacité de recrutement local | 3 | TECHDIFRIK opère depuis Abidjan ; le bassin local doit pouvoir alimenter la croissance. |
| Adéquation au CDC | 4 | Le CDC impose une API REST, des WebSocket pour le temps réel, PostgreSQL, S3-compatible, RGPD UE. |
| Tolérance à la nouveauté | 3 | MVP livrable en 3-5 mois, équilibre entre productivité et pérennité. |

## Données d'entrée

- **Compétences équipe** : PHP/Laravel **et** React/TypeScript (les deux maîtrisées).
- **Recrutement** : équipe stable, recrutement non prioritaire à court terme.
- **SI existant** : aucune contrainte forte.
- **Tolérance** : équilibre — stack mature mais activement maintenue.

## Options évaluées

### Scénario 1 — TypeScript full-stack (Next.js + NestJS)

| Critère | Score |
|---|---|
| Compétences équipe | ★★★ (React OK, NestJS à apprendre) |
| Recrutement | ★★★★ |
| Adéquation CDC | ★★★★★ (WebSocket natif, DI claire, parfait pour API REST) |
| Tolérance | ★★★ (acceptable mais courbe NestJS) |

**Verdict.** Bonne stack, mais l'argument fort « un seul langage » perd sa valeur quand l'équipe maîtrise déjà PHP. Coût d'apprentissage NestJS non justifié.

### Scénario 2 — Laravel + Next.js

| Critère | Score |
|---|---|
| Compétences équipe | ★★★★★ (les deux compétences exploitées) |
| Recrutement | ★★★★★ |
| Adéquation CDC | ★★★★ (Reverb couvre les WebSocket, queues natives, broadcasting) |
| Tolérance | ★★★★ (Laravel 11 + Next.js 15 sont matures et activement maintenus) |

**Verdict.** Combinaison « headless » qui exploite les deux compétences principales. Productivité maximale sur les deux côtés. Risque d'apprentissage proche de zéro.

### Scénario 3 — Django + Next.js

| Critère | Score |
|---|---|
| Compétences équipe | ★ (Python pas dans les compétences) |
| Recrutement | ★★★ |
| Adéquation CDC | ★★★★ |
| Tolérance | ★★★ |

**Verdict.** Écarté pour non-correspondance aux compétences.

## Décision retenue

**Scénario 2 — Laravel + Next.js**.

### Composition détaillée

#### Backend

| Composant | Choix | Notes |
|---|---|---|
| Framework | **Laravel 11** | Version LTS active. PHP 8.3+ requis. |
| ORM | Eloquent | Natif. |
| Authentification | JWT via `php-open-source-saver/jwt-auth` | Le CDC §9.3 impose JWT court + refresh. Laravel Sanctum fait du token natif mais s'éloigne du standard JWT. |
| Temps réel | **Laravel Reverb** | Composant officiel depuis Laravel 11, s'intègre au broadcasting Laravel. Évite la dépendance Pusher ou Soketi. |
| Queue worker | Laravel Queue + driver Redis | Notifications, envoi de courriels, scan antivirus. |
| Scheduler | Laravel Scheduler (cron) | Tâches périodiques (purge brouillons, expiration clôture, etc.). |
| Tests | **Pest** | Plus lisible que PHPUnit, compatible avec l'écosystème. |
| Linter | **Laravel Pint** | Conventions PSR-12. |
| Migrations | Migrations natives Laravel | Idiomatique. |

#### Frontend

| Composant | Choix | Notes |
|---|---|---|
| Framework | **Next.js 15** | App Router (par défaut). |
| Langage | **TypeScript strict** | Conforme CDC §11.10.3. |
| Style | **TailwindCSS** + **shadcn/ui** | Productivité élevée, composants accessibles modifiables. |
| Forms | React Hook Form + Zod | Validation typée alignée sur l'API. |
| HTTP | TanStack Query (`@tanstack/react-query`) + client OpenAPI généré | Caching, invalidation, états optimistes. |
| WebSocket client | `laravel-echo` + `pusher-js` (configuré sur Reverb) | Pattern officiel Laravel. |
| Tests unitaires | Vitest | Plus rapide que Jest. |
| Tests E2E | Playwright | Conforme CDC §11.10.1. |

#### Infrastructure

| Composant | Choix | Notes |
|---|---|---|
| Base de données | **PostgreSQL 16** managed Scaleway | Extension `pg_trgm` activée pour la recherche. |
| Cache / file | **Redis 7** managed Scaleway | Refresh tokens, sessions WS, file de notifications. |
| Stockage objet | **Scaleway Object Storage** (région `fr-par`) | S3-compatible, versionnement activé. |
| Courriel | **SendGrid** | Délivrabilité, SPF/DKIM/DMARC. |
| Antivirus | **ClamAV** auto-hébergé | Conteneur sidecar sur le VPS. |
| Hash | **bcrypt** coût 12 | Défaut Laravel ; argon2id reste possible mais bcrypt est plus simple à opérer. |
| Erreurs | **Sentry** (Cloud UE) | Laravel + Next.js intégrés via SDK officiels. |
| Logs/métriques (MVP) | Sentry Performance dans un premier temps | Stack Grafana plus tard si besoin (décision différée). |

#### Opérations

| Composant | Choix | Notes |
|---|---|---|
| Hébergeur | **Scaleway** | Région Paris (`fr-par`). |
| Mode opérationnel | VPS + **Laravel Forge** | Forge pilote Nginx + PHP-FPM + queue workers + cron + Reverb + certs Let's Encrypt. Push GitHub → deploy auto. |
| Topologie | 1 VPS prod (4 vCPU, 8 Go RAM) + 1 VPS staging (2 vCPU, 4 Go) | Suffit pour la volumétrie cible MVP (chapitre 11 §11.1.2). |
| CI/CD | **GitHub Actions** | Build + tests + analyse statique + déclenchement Forge deploy. |
| Gestion des secrets | Forge Environments + Scaleway Secret Manager | Pour les clés tierces (SendGrid, Sentry). |

### Coût mensuel estimé

| Poste | Montant |
|---|---|
| VPS prod Scaleway (4 vCPU, 8 Go) | ~ 30 €/mois |
| VPS staging Scaleway (2 vCPU, 4 Go) | ~ 15 €/mois |
| PostgreSQL Database for Scaleway (DB-DEV-S) | ~ 15 €/mois |
| Redis (sur le VPS prod ou Database for Scaleway) | 0-12 €/mois |
| Scaleway Object Storage (cible 30 Go) | ~ 1 €/mois |
| Laravel Forge (plan « Basic ») | ~ 12 €/mois (~ $12/mo) |
| SendGrid (free tier 100/jour ou Essentials) | 0-20 €/mois |
| Sentry (Developer / Team) | 0-25 €/mois |
| Nom de domaine | ~ 1 €/mois |
| **Total estimé** | **~ 75-130 €/mois** |

À actualiser à la hausse en production stabilisée.

## Conséquences

### Positives

- Productivité immédiate sur les deux extrémités (front et back).
- Aucun investissement formation initial significatif.
- Écosystème Laravel offre nativement les briques attendues par le CDC : queues, broadcasting, scheduling, validations, policies, migrations, factories pour les seeds.
- Forge réduit drastiquement la charge ops pour une équipe sans DevOps dédié.
- Coût mensuel maîtrisé (~ 100 €/mois ordre de grandeur).
- RGPD UE garanti par Scaleway Paris.

### Négatives / risques

- Le WebSocket via Reverb nécessite un processus dédié (managed par Forge). Un point de défaillance supplémentaire ; à surveiller (alerting CDC §11.7.4).
- Laravel + Next.js implique deux dépôts ou un monorepo : la cohérence des types entre back et front demande un effort (génération OpenAPI → types TypeScript).
- En cas de croissance massive (> 10x la volumétrie cible), une migration vers Kubernetes pourrait devenir nécessaire. La conteneurisation Docker reste accessible en backup.

### Mitigations

- Générer la spec OpenAPI depuis Laravel (par ex. `dedoc/scramble` ou `vyuldashev/laravel-openapi`) et utiliser un générateur de client TypeScript dans la CI front pour conserver des types synchronisés.
- Surveiller le processus Reverb avec une healthcheck dédiée ; basculer sur Pusher Cloud comme fallback en cas de problème opérationnel.
- Conserver dans le dépôt un `Dockerfile` minimal dès le début, pour ne pas être bloqué si une migration vers conteneurs devient nécessaire.

## Décisions liées

- Le **scaffold initial** doit être créé en respectant cette stack (ADR-002 à venir si déviation).
- L'**ouverture du dépôt GitHub** est prérequise (la décision de l'hébergement du code — GitHub, GitLab, Gitea — n'est pas dans cet ADR mais doit être faite avant le scaffold).
- Les **conventions de code** (PSR-12 côté Laravel, ESLint config Next côté front) sont fixées par les linters retenus.

## Suivi

- Réévaluation 6 mois après la mise en production du MVP : vérifier l'adéquation, les coûts réels, les besoins de scalabilité, et décider d'éventuels ajustements.
