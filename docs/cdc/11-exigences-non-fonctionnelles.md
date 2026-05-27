# 11 — Exigences non fonctionnelles

## 11.1 Performance

### 11.1.1 Temps de réponse cibles

Mesurés au 95e percentile (P95), en charge nominale (voir §11.1.2).

| Type de requête | Cible P95 | Cible P99 |
|---|---|---|
| Lecture simple (détail d'une demande) | < 300 ms | < 800 ms |
| Lecture paginée (file d'attente, 25 items) | < 500 ms | < 1 200 ms |
| Création d'une demande | < 800 ms | < 2 000 ms |
| Transition d'état | < 500 ms | < 1 200 ms |
| Recherche full-text | < 1 000 ms | < 2 500 ms |
| Génération de tableau de bord stratégique | < 2 000 ms | < 5 000 ms (asynchrone si dépassement systématique) |
| Upload de pièce jointe (URL pré-signée) | < 400 ms | < 1 000 ms |

- **[EXG-11-001] (MUST)** Les requêtes d'écriture déclenchant des effets secondaires lourds (notifications, calcul de SLA) restent **non bloquantes** : la réponse est renvoyée dès la persistance en base, les effets secondaires sont délégués au broker asynchrone.

### 11.1.2 Charge cible MVP

Estimations basées sur l'hypothèse d'un démarrage progressif (à valider auprès du Département Commercial) :

| Indicateur | Valeur cible MVP | Pic envisagé |
|---|---|---|
| Comptes Client actifs | 200 | 500 |
| Comptes internes (Gestionnaire + Responsable + Admin + DG) | 30 | 80 |
| Demandes créées par jour | 50 | 200 |
| Volume cumulé de demandes en 12 mois | ~ 15 000 | ~ 50 000 |
| Connexions concurrentes (WebSocket) | 50 | 200 |
| Requêtes API par minute | 500 | 2 000 |
| Pièces jointes téléversées par jour | 100 | 400 |
| Volume cumulé de pièces jointes en 12 mois | ~ 30 Go | ~ 100 Go |

> **[EXG-11-010] (MUST)** L'architecture doit supporter la valeur « Pic envisagé » sans dégradation perceptible. Au-delà, une mise à l'échelle horizontale doit être possible sans refonte.

### 11.1.3 Tests de charge

- **[EXG-11-020] (MUST)** Un test de charge automatisé (k6, Locust, JMeter) est exécuté **avant la mise en production**, simulant les scénarios suivants pendant 30 minutes :
  - 100 clients concurrents créant et suivant des demandes.
  - 5 gestionnaires concurrents qualifiant et affectant.
  - 10 responsables concurrents traitant.
  - 1 export CSV simultané.
- **[EXG-11-021] (SHOULD)** Le rapport de test est versionné dans le dépôt et rejoué à chaque release majeure.

## 11.2 Disponibilité

- **[EXG-11-030] (MUST)** Disponibilité cible MVP : **99,5 %** en horaires ouvrés (8h-18h, lundi-vendredi), soit ~13h d'indisponibilité par an autorisées hors fenêtre de maintenance planifiée.
- **[EXG-11-031] (SHOULD)** Disponibilité cible V2 : 99,9 % en 24/7 (~8h d'indisponibilité par an).
- **[EXG-11-032] (MUST)** Fenêtre de maintenance planifiée : **dimanche 22h-2h du matin** (heure d'Abidjan), annoncée 7 jours à l'avance via notification in-app et courriel à tous les utilisateurs.
- **[EXG-11-033] (MUST)** Une page de statut publique (chapitre 06 §6.1.1) communique en temps réel l'état de la plateforme.
- **[EXG-11-034] (SHOULD)** L'architecture autorise un déploiement sans interruption (blue/green ou rolling) pour les mises à jour mineures.

## 11.3 Scalabilité

- **[EXG-11-040] (MUST)** L'application web et l'API sont **stateless** : aucune donnée de session n'est stockée en mémoire d'instance. Toute donnée d'état (refresh tokens, sessions WebSocket) est dans Redis ou la base.
- **[EXG-11-041] (MUST)** Mise à l'échelle horizontale supportée pour le frontend, l'API et le service de notifications.
- **[EXG-11-042] (SHOULD)** La base de données supporte une lecture sur réplicas (read replicas) pour décharger les tableaux de bord intensifs.
- **[EXG-11-043] (MUST)** Le service WebSocket supporte plusieurs instances avec partage via Redis Pub/Sub (ou équivalent).

## 11.4 Accessibilité

- **[EXG-11-050] (MUST)** Conformité **WCAG 2.1 niveau AA** sur l'ensemble des écrans utilisateurs (espaces Client, Gestionnaire, Responsable, Administrateur, DG).
- **[EXG-11-051] (MUST)** Audit d'accessibilité (automatisé via axe-core ou Lighthouse, et manuel) avant la mise en production du MVP.
- **[EXG-11-052] (MUST)** Tous les composants interactifs sont accessibles au clavier ; ordre de tabulation logique.
- **[EXG-11-053] (MUST)** Contraste minimum 4.5:1 pour le texte courant, 3:1 pour le texte large.
- **[EXG-11-054] (MUST)** Toute information transmise par la couleur seule est doublée par un libellé ou une icône (par exemple, les niveaux de priorité ne reposent pas uniquement sur la couleur).

## 11.5 Internationalisation et localisation

- **[EXG-11-060] (MUST)** Langue d'interface MVP : **français uniquement** (FR-FR / FR-CI).
- **[EXG-11-061] (SHOULD)** L'architecture doit néanmoins externaliser tous les libellés dans des fichiers de traduction (`i18n`) pour permettre l'ajout de l'anglais en V2 sans refactor.
- **[EXG-11-062] (MUST)** Format des dates : `DD/MM/YYYY HH:mm` (24h) avec fuseau utilisateur affiché.
- **[EXG-11-063] (MUST)** Format monétaire (si applicable, en V2) : FCFA avec séparateur de milliers espace.
- **[EXG-11-064] (MUST)** Toutes les saisies acceptent les caractères Unicode étendu (accents français, apostrophes typographiques, etc.).

## 11.6 Compatibilité

### 11.6.1 Navigateurs

- **[EXG-11-070] (MUST)** Versions supportées : les **deux dernières versions majeures** au moment de la sortie du MVP de Chrome, Edge, Firefox, Safari (desktop et mobile).
- **[EXG-11-071] (MUST)** Internet Explorer 11 et antérieurs : non supportés. Un message clair invite à mettre à jour.
- **[EXG-11-072] (SHOULD)** Tests automatisés cross-navigateurs via Playwright ou équivalent.

### 11.6.2 Mobile

- **[EXG-11-080] (MUST)** Application web **responsive et mobile-first**. Toutes les fonctionnalités clés sont utilisables sur écran 360px de large.
- **[EXG-11-081] (SHOULD)** PWA installable (manifest + service worker minimal) — préparation à l'évolution V2 vers une app native.
- **[EXG-11-082] (WONT au MVP)** Notifications push mobiles natives — V2.

## 11.7 Observabilité

### 11.7.1 Logs

- **[EXG-11-090] (MUST)** Logs structurés en **JSON**, agrégés dans un service centralisé (ELK, Grafana Loki, ou équivalent hébergé selon arbitrage).
- **[EXG-11-091] (MUST)** Niveaux : `DEBUG`, `INFO`, `WARN`, `ERROR`. Production : `INFO` et plus.
- **[EXG-11-092] (MUST)** Aucune donnée nominative ni secret en clair dans les logs. Les identifiants utilisateurs (UUID) sont autorisés.
- **[EXG-11-093] (MUST)** Rétention des logs : 90 jours en chaud, 1 an en froid.

### 11.7.2 Métriques

- **[EXG-11-100] (MUST)** Émission de métriques au format **Prometheus** (ou équivalent OpenTelemetry) :
  - Métriques applicatives : taux de requêtes par endpoint, latences P50/P95/P99, taux d'erreurs.
  - Métriques métier : nombre de demandes créées / clôturées / réouvertes, distribution par priorité, taux de respect SLA, taux de notifications délivrées vs échouées.
  - Métriques infrastructure : CPU, RAM, I/O disque, connexions DB, longueur de la file d'attente du broker.
- **[EXG-11-101] (MUST)** Tableaux de bord opérationnels (Grafana ou équivalent) accessibles à l'équipe IT.

### 11.7.3 Traces

- **[EXG-11-110] (SHOULD)** Tracing distribué (OpenTelemetry) sur les chemins critiques (création de demande, transition, génération de tableau de bord).
- **[EXG-11-111] (MUST)** Chaque requête HTTP a un `request_id` propagé dans tous les logs et traces (voir chapitre 9 §9.11).

### 11.7.4 Alerting

- **[EXG-11-120] (MUST)** Alertes critiques (page d'astreinte ou message hors plateforme) :
  - Disponibilité < seuil (health check échoue 3 fois consécutives).
  - Taux d'erreur 5xx > 5 % pendant 5 minutes.
  - Latence P95 > 2× cible pendant 10 minutes.
  - Disque > 85 % de remplissage.
  - File du broker > 10 000 messages en attente.
- **[EXG-11-121] (MUST)** Alertes informationnelles (Slack/Teams) sur les anomalies non critiques.

## 11.8 Sauvegardes et restauration

Voir chapitre 10 §10.8. En complément :

- **[EXG-11-130] (MUST)** Stockage des sauvegardes sur un emplacement **physiquement distinct** de la production (compte cloud séparé ou région différente).
- **[EXG-11-131] (MUST)** Procédure documentée de restauration partielle (un compte, une demande) et totale (PRA complet).

## 11.9 Hébergement

> Cette section précise les contraintes d'hébergement, indépendamment de l'hébergeur retenu (voir annexe A2).

### 11.9.1 Environnements

- **[EXG-11-140] (MUST)** Au minimum **trois environnements** : `dev` (intégration continue, données factices), `staging`/`recette` (iso-prod, données anonymisées), `production`.
- **[EXG-11-141] (MUST)** L'environnement de recette est strictement isolé de la production (réseaux, secrets, comptes).
- **[EXG-11-142] (MUST)** L'accès à la production est restreint à un nombre limité d'opérateurs identifiés (principe du moindre privilège).

### 11.9.2 Réseau

- **[EXG-11-150] (MUST)** Base de données et Redis dans un **réseau privé**, jamais accessibles depuis Internet.
- **[EXG-11-151] (MUST)** Accès opérateur via **bastion** ou solution équivalente (SSM, Cloud Identity-Aware Proxy, etc.).
- **[EXG-11-152] (MUST)** Pare-feu applicatif (WAF) en amont de l'API et du frontend pour bloquer les patterns d'attaque connus.

### 11.9.3 Conteneurisation et orchestration

- **[EXG-11-160] (SHOULD)** Déploiement conteneurisé (Docker), orchestré sur **Kubernetes managé** (EKS, OVH Managed Kubernetes, Scaleway Kapsule) ou alternative simple (Docker Swarm, ECS, Nomad) — à arbitrer en fonction des compétences internes.
- **[EXG-11-161] (MUST)** Les images sont signées et stockées dans un registre privé. Aucune image issue d'un dépôt public non vérifié n'est utilisée en production.

### 11.9.4 Stockage des pièces jointes

- **[EXG-11-170] (MUST)** Service compatible **S3** (AWS S3, MinIO auto-hébergé, Wasabi, Scaleway Object Storage). Mêmes APIs ; le choix est documenté dans l'annexe A2.
- **[EXG-11-171] (MUST)** Versionnement activé sur le bucket pour permettre la récupération en cas d'erreur de manipulation.
- **[EXG-11-172] (MUST)** Aucun accès public direct au bucket ; l'accès se fait exclusivement via URL pré-signées (chapitre 9 §9.5.2).

## 11.10 Qualité logicielle

### 11.10.1 Tests

- **[EXG-11-180] (MUST)** Couverture de tests unitaires ≥ **80 %** sur la logique métier (calcul de priorité, machine à états, autorisation).
- **[EXG-11-181] (MUST)** Tests d'intégration sur les endpoints API critiques (auth, création, transitions, recherche).
- **[EXG-11-182] (MUST)** Tests end-to-end (Playwright ou Cypress) sur les parcours utilisateurs principaux :
  - Client : connexion → création demande → suivi → réponse → évaluation.
  - Gestionnaire : connexion → file → qualification → affectation.
  - Responsable : connexion → file → traitement → proposition de clôture.
- **[EXG-11-183] (MUST)** Pipeline d'intégration continue exécutant tous les tests à chaque pull request ; merge bloqué en cas d'échec.

### 11.10.2 Revue de code

- **[EXG-11-190] (MUST)** Toute modification du code de production passe par une **pull request** approuvée par au moins une personne autre que l'auteur.
- **[EXG-11-191] (MUST)** Convention de commit standardisée (Conventional Commits ou équivalent), permettant la génération automatique du changelog.

### 11.10.3 Qualité statique

- **[EXG-11-200] (MUST)** Analyse statique (linters, type-check strict) bloquante en CI.
- **[EXG-11-201] (MUST)** Outil de mesure de la dette technique (SonarQube ou équivalent) : seuil de dette tolérée à définir lors du démarrage.

### 11.10.4 Documentation technique

- **[EXG-11-210] (MUST)** README à la racine du dépôt expliquant : démarrage local, structure, scripts disponibles, contacts.
- **[EXG-11-211] (MUST)** Spécification OpenAPI publiée et tenue à jour (chapitre 9 §9.12).
- **[EXG-11-212] (MUST)** ADR (Architecture Decision Records) maintenus pour toute décision structurante.

## 11.11 Maintenance et support post-MVP

- **[EXG-11-220] (MUST)** Le Département Développement TECHDIFRIK est responsable du **maintien en conditions opérationnelles** (MCO) après la mise en production.
- **[EXG-11-221] (MUST)** Niveau de service interne : prise en compte des incidents critiques sous 4 heures en jours ouvrés. Niveaux fins à formaliser dans un document interne séparé.
- **[EXG-11-222] (MUST)** Plan de mises à jour mensuel pour les correctifs de sécurité (CVE) des dépendances.

## 11.12 Récapitulatif des arbitrages techniques

### 11.12.1 Arbitrages tranchés (v0.3 — mai 2026)

La décision en vigueur est documentée dans [ADR-002](../adr/0002-stack-backend-nestjs.md), qui supersede partiellement [ADR-001](../adr/0001-stack-technique.md) (le frontend, les services managés, l'hébergeur et SendGrid restent valides ; le backend Laravel a été remplacé par NestJS, et Forge par Docker Compose).

| Sujet | Décision |
|---|---|
| Frontend | **Next.js 16.2.2** (App Router) + **React 19** + TypeScript strict (≥ 5.1) + TailwindCSS + shadcn/ui |
| Backend | **NestJS 11.1.16** sur **Node.js 22 LTS** (≥ 20 requis), TypeScript strict, Express v5 par défaut |
| ORM | **TypeORM 0.3+** (entités décorées, migrations natives) |
| Authentification JWT | `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt` ; JWT court 15 min + refresh 7 j rotatif |
| Validation des entrées | `class-validator` + `class-transformer` + DTOs, `ValidationPipe` global |
| Temps réel WebSocket | `@nestjs/websockets` + adaptateur **Socket.io**, auth JWT au handshake |
| Queue asynchrone | **BullMQ** via `@nestjs/bullmq` (notifications, courriels, scan antivirus, exports) |
| Scheduler / cron | `@nestjs/schedule` |
| Documentation API | `@nestjs/swagger` (OpenAPI 3.1 généré depuis le code) |
| Logging | **Pino** via `nestjs-pino` (JSON structuré) |
| Configuration | `@nestjs/config` + validation Joi ou Zod |
| Tests | **Jest** + Supertest (back), Vitest + Playwright (front) |
| Linters | **ESLint** (config NestJS) + **Prettier** (back et front harmonisés) |
| Base de données | **PostgreSQL 16** managed Scaleway (extension `pg_trgm`) |
| Cache / file de messages | **Redis 7** managed Scaleway (cache, sessions WS, BullMQ) |
| Stockage S3 | **Scaleway Object Storage** via `@aws-sdk/client-s3` |
| Service de courriel | **SendGrid** via `@sendgrid/mail` |
| Antivirus | **ClamAV** auto-hébergé (conteneur Docker, accès TCP `clamd`) |
| Erreurs applicatives | **Sentry** (Cloud UE) — SDK NestJS et Next.js |
| Hébergeur | **Scaleway** (région `fr-par`) |
| Mode opérationnel | **Docker Compose** sur VPS, reverse proxy **Traefik** (Let's Encrypt natif), registre **GitHub Container Registry** |
| CI/CD | **GitHub Actions** : lint + type-check + tests + build images + déploiement SSH |
| Hash mot de passe | **bcrypt** (npm) coût 12 |
| Migrations DB | Migrations **TypeORM** (`migration:generate`, `migration:run`) |

### 11.12.2 Arbitrages encore en attente

| Sujet | Options | Décideur | Échéance |
|---|---|---|---|
| Logs et métriques | Stack Grafana (Loki + Prometheus) ou Sentry Performance pour le MVP | Dépt. Dév | Avant ouverture aux clients pilotes |
| SLA cibles par priorité | Valeurs proposées chapitre 05 | DG | Avant démarrage |
| Volumétrie cible | À confirmer | Direction commerciale | Avant démarrage |
| DPO désigné | À nommer | DG | Avant ouverture aux clients pilotes |
| Adresses dédiées | `notifications@…`, `support-mytdfrik@…` | DG + IT | Avant intégration SPF/DKIM/DMARC |
| Domaine de la plateforme | À confirmer | DG + IT | Avant démarrage |
| Domaine de la page de statut | Sous-domaine séparé ou service tiers (Statuspage, Better Stack) | Dépt. Dév + IT | Avant ouverture aux clients pilotes |
