# A2 — Matrice de comparaison des stacks proposées

Cette annexe est un outil d'aide à l'arbitrage. Les évaluations sont indicatives ; la décision finale doit s'appuyer sur les **compétences réelles** de l'équipe TECHDIFRIK.

## A2.1 Frontend

| Critère | Poids | Next.js (React) | Nuxt (Vue.js) |
|---|:---:|:---:|:---:|
| Maturité de l'écosystème | 5 | ★★★★★ | ★★★★ |
| Courbe d'apprentissage initiale | 3 | ★★★ (JSX, hooks) | ★★★★ (templates plus familiers) |
| Disponibilité de développeurs sur le marché ivoirien | 5 | ★★★★ | ★★★ |
| Performance native (SSR, ISR, streaming) | 4 | ★★★★★ | ★★★★★ |
| Bibliothèques UI matures | 4 | ★★★★★ (MUI, Chakra, shadcn, Mantine) | ★★★★ (Vuetify, Naive UI, PrimeVue) |
| TypeScript de première classe | 4 | ★★★★★ | ★★★★ |
| Outillage de test | 3 | ★★★★ (Vitest/Jest + Playwright) | ★★★★ (Vitest + Playwright) |
| Documentation officielle | 3 | ★★★★ | ★★★★★ |
| Compatibilité PWA | 2 | ★★★★ | ★★★★ |

**Verdict indicatif.** Les deux options sont solides. Next.js est privilégié si l'équipe a une appétence React préexistante ou si le recrutement local est un critère fort. Nuxt est privilégié si l'équipe vient du PHP/Laravel ou si la simplicité d'onboarding prime.

## A2.2 Backend

| Critère | Poids | NestJS (Node/TS) | Laravel (PHP) | Django (Python) |
|---|:---:|:---:|:---:|:---:|
| Maturité de l'écosystème | 5 | ★★★★ | ★★★★★ | ★★★★★ |
| Disponibilité de développeurs en Côte d'Ivoire | 5 | ★★★★ | ★★★★★ | ★★★ |
| Adéquation à une API REST stricte | 5 | ★★★★★ | ★★★★ | ★★★★ |
| ORM et migrations | 4 | ★★★★ (TypeORM, Prisma) | ★★★★★ (Eloquent + migrations) | ★★★★★ (Django ORM + migrations) |
| Tests intégrés et idiomatiques | 4 | ★★★★ (Jest) | ★★★★★ (PHPUnit + Pest) | ★★★★★ (pytest) |
| Performance brute | 3 | ★★★★ (Node V8) | ★★★ (PHP 8 + OPcache) | ★★★ (Python WSGI/ASGI) |
| Architecture modulaire structurée | 5 | ★★★★★ (DI, modules) | ★★★★ (service container) | ★★★ (apps Django) |
| Sécurité par défaut | 4 | ★★★★ | ★★★★★ | ★★★★★ |
| Outillage WebSocket | 4 | ★★★★★ (Gateway intégré) | ★★★ (broadcasting + dépendance tierce) | ★★★ (Channels) |
| Cohérence linguistique avec le frontend | 3 | ★★★★★ (TS partout) | ★★★ | ★★★ |
| Coût d'hébergement | 2 | ★★★★ | ★★★★ | ★★★★ |
| Compatibilité avec le SI existant TECHDIFRIK | 5 | [À ÉVALUER] | [À ÉVALUER] | [À ÉVALUER] |

**Verdict indicatif.**

- **NestJS** : recommandé si vous avez (ou recrutez) du TypeScript côté front et back ; offre la meilleure cohérence stack-wide et un excellent support WebSocket.
- **Laravel** : recommandé si l'équipe a déjà une expertise PHP forte ; la productivité immédiate est imbattable, l'écosystème est mature.
- **Django** : recommandé si l'équipe a une expertise Python et/ou ambitionne d'intégrer rapidement du traitement de données (V2 BI).

## A2.3 Hébergeur

| Critère | AWS | OVH | Scaleway |
|---|:---:|:---:|:---:|
| Maturité et catalogue de services | ★★★★★ | ★★★★ | ★★★★ |
| Présence en UE | ★★★★ (régions EU) | ★★★★★ (français, RGPD natif) | ★★★★★ (français, RGPD natif) |
| Coût pour une charge modérée | ★★★ | ★★★★ | ★★★★★ |
| Documentation et communauté | ★★★★★ | ★★★★ | ★★★★ |
| Outils managés (RDS PostgreSQL, S3, Kubernetes) | ★★★★★ | ★★★★ | ★★★★ |
| Service S3 natif | ★★★★★ (S3) | ★★★★ (Object Storage) | ★★★★★ (Object Storage S3-compatible) |
| Conformité RGPD et juridiction | ★★★ (clauses CCT à signer) | ★★★★★ | ★★★★★ |
| Proximité géographique (Afrique de l'Ouest) | ★★★ (Cape Town) | ★★ (UE uniquement) | ★★★ (UE uniquement) |

**Verdict indicatif.** OVH ou Scaleway sont privilégiés si la conformité RGPD et la maîtrise des coûts dominent. AWS est privilégié si le SI TECHDIFRIK a déjà une empreinte AWS, ou si l'outillage managé évolué est un facteur clé.

## A2.4 Service de courriel transactionnel

| Critère | SendGrid | Mailgun |
|---|:---:|:---:|
| Délivrabilité moyenne | ★★★★★ | ★★★★ |
| Tarification (volumes < 50k/mois) | ★★★★ | ★★★★★ |
| Support des webhooks (bounces, opens) | ★★★★★ | ★★★★★ |
| API et SDKs | ★★★★ | ★★★★ |
| Plans gratuits pour démarrer | ★★★★★ (100/jour) | ★★★★ (5 000/mois pendant 3 mois) |
| Documentation | ★★★★★ | ★★★★ |
| Conformité RGPD | ★★★★ (DPA disponible) | ★★★★ (DPA disponible) |

**Verdict indicatif.** Les deux conviennent. SendGrid est privilégié pour la délivrabilité et l'écosystème. Mailgun est privilégié si l'envoi de gros volumes est anticipé rapidement.

## A2.5 Stockage S3-compatible

| Critère | AWS S3 | MinIO (auto-hébergé) | Wasabi | Scaleway Object Storage |
|---|:---:|:---:|:---:|:---:|
| Coût stockage (€/Go/mois) | ★★★ | ★★★★★ (CAPEX matériel) | ★★★★★ | ★★★★ |
| Coût transferts sortants | ★★ | ★★★★★ | ★★★★★ | ★★★★ |
| Disponibilité gérée | ★★★★★ | ★★ (à votre charge) | ★★★★ | ★★★★ |
| Conformité RGPD (régions UE) | ★★★★ | ★★★★★ | ★★★★ | ★★★★★ |
| Versioning natif | ★★★★★ | ★★★★ | ★★★★ | ★★★★ |
| Compatibilité API | ★★★★★ | ★★★★★ | ★★★★★ | ★★★★ |

**Verdict indicatif.** Wasabi ou Scaleway pour minimiser les coûts à charge modérée. MinIO auto-hébergé est viable si l'équipe a déjà l'expertise infrastructure et veut une indépendance totale. AWS S3 reste la référence si déjà présent dans le SI.

## A2.6 Synthèse — Trois scénarios cohérents proposés

### Scénario 1 — « TypeScript full-stack »

- Frontend : **Next.js** (TypeScript)
- Backend : **NestJS** (TypeScript)
- DB : PostgreSQL managé
- Hébergeur : **Scaleway** ou **AWS**
- Stockage : Scaleway Object Storage ou Wasabi
- Courriel : SendGrid
- Avantage : un seul langage du front au back, recrutement TS uniforme, excellent support WebSocket natif (NestJS Gateway).
- Inconvénient : courbe d'apprentissage NestJS si l'équipe vient de React pur.

### Scénario 2 — « PHP éprouvé »

- Frontend : **Nuxt** (Vue.js) ou **Next.js**
- Backend : **Laravel**
- DB : PostgreSQL managé (Laravel supporte aussi MySQL)
- Hébergeur : **OVH** ou **Scaleway**
- Stockage : Scaleway Object Storage
- Courriel : Mailgun ou SendGrid
- Avantage : productivité Laravel maximale, large bassin de développeurs PHP en Côte d'Ivoire, opérations simples.
- Inconvénient : WebSocket nécessite un service auxiliaire (Laravel Reverb, Soketi).

### Scénario 3 — « Python orienté data »

- Frontend : **Next.js** (React)
- Backend : **Django** + Django REST Framework + Django Channels
- DB : PostgreSQL managé
- Hébergeur : **OVH** ou **AWS**
- Stockage : AWS S3 ou Scaleway Object Storage
- Courriel : SendGrid
- Avantage : prépare une V2 « BI / analytique » riche, écosystème Python vaste.
- Inconvénient : moins de développeurs Python disponibles localement (à valider).
