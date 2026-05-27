# Cahier des charges — MyTDFRIK

**Plateforme web de gestion centralisée des demandes clients**

---

## Métadonnées du document

| Champ | Valeur |
|---|---|
| Projet | MyTDFRIK |
| Maître d'ouvrage | Direction Générale, TECHDIFRIK |
| Maître d'œuvre | Département Développement, TECHDIFRIK |
| Statut | Brouillon — stack arbitrée |
| Version | 0.3.1 |
| Date | Mai 2026 |
| Document source | `Note_Presentation_MyTDFRIK.docx` (note de cadrage v1.1, mai 2026) |
| Référence | CDC-MYTDFRIK-001 |

## Historique des versions

| Version | Date | Auteur | Nature des modifications |
|---|---|---|---|
| 0.1 | 2026-05 | Département Développement | Création initiale à partir de la note de cadrage v1.1. |
| 0.2 | 2026-05 | Département Développement | Arbitrage de la stack technique : Laravel 11 (back), Next.js 15 (front), Scaleway + Laravel Forge (opérations). Voir [ADR-001](../adr/0001-stack-technique.md). |
| 0.3 | 2026-05 | Département Développement | Bascule du backend de Laravel à **NestJS 11** (TypeScript + TypeORM + BullMQ + Socket.io), opérations **Docker Compose sur VPS** au lieu de Forge. Justification : base NestJS existante côté équipe + montée en compétences. Voir [ADR-002](../adr/0002-stack-backend-nestjs.md). |
| 0.3.1 | 2026-05 | Département Développement | Précision des versions stables exactes via Context7 : **Next.js 16.2.2**, **NestJS 11.1.16**, **Node.js 22 LTS**. Note sur le renommage `middleware.ts` → `proxy.ts` dans Next.js 16. |

## Statut des arbitrages

| Arbitrage | Statut | Décision |
|---|---|---|
| Nom du produit | Arbitré | **MyTDFRIK** |
| Stack technique frontend | **Arbitré** | **Next.js 16.2.2** (App Router, Node.js ≥ 20.9, React 19) + TypeScript strict + TailwindCSS + shadcn/ui |
| Stack technique backend | **Arbitré** | **NestJS 11.1.16** sur **Node.js 22 LTS** + TypeScript strict + TypeORM 0.3+ + BullMQ + Socket.io (Express v5 par défaut) |
| Base de données | **Arbitré** | **PostgreSQL 16** managed Scaleway |
| Cache / file de messages | **Arbitré** | **Redis 7** managed Scaleway |
| Stockage des pièces jointes | **Arbitré** | **Scaleway Object Storage** (S3-compatible) |
| Service de courriel | **Arbitré** | **SendGrid** |
| Hébergeur | **Arbitré** | **Scaleway** (Paris) |
| Mode opérationnel | **Arbitré** | **Docker Compose** sur VPS, reverse proxy Traefik, registre GitHub Container Registry |
| Algorithme de hash | **Arbitré** | **bcrypt** (npm) coût 12 |
| Antivirus pièces jointes | **Arbitré** | **ClamAV** auto-hébergé (conteneur Docker, accès TCP clamd interne) |
| Erreurs applicatives | **Arbitré** | **Sentry** (Cloud UE) |
| Logs et métriques | À arbitrer | Stack Grafana (Loki + Prometheus) ou Sentry Performance pour le MVP |
| SLA cible par priorité | À valider DG | Valeurs proposées au chapitre 05 |
| Planning prévisionnel | À définir | Sera produit après scaffolding du dépôt |
| DPO désigné | À nommer | Voir chapitre 10 §10.7 |
| Adresses dédiées | À valider | `notifications@…`, `support-mytdfrik@…` |

## Table des matières

- [01 — Contexte, enjeux et objectifs](01-contexte-objectifs.md)
- [02 — Acteurs, rôles et droits](02-acteurs-roles.md)
- [03 — Périmètre fonctionnel](03-perimetre-fonctionnel.md)
- [04 — Cycle de vie d'une demande](04-cycle-vie-demande.md)
- [05 — Priorisation (matrice Impact × Urgence)](05-priorisation.md)
- [06 — Signalement et suivi des bugs](06-signalement-bugs.md)
- [07 — Notifications](07-notifications.md)
- [08 — Modèle de données](08-modele-donnees.md)
- [09 — API REST](09-api-endpoints.md)
- [10 — Sécurité et conformité RGPD](10-securite-rgpd.md)
- [11 — Exigences non fonctionnelles](11-exigences-non-fonctionnelles.md)
- [12 — Cahier de recette](12-recette.md)

### Annexes

- [A1 — Glossaire et acronymes](annexes/A1-glossaire.md)
- [A2 — Matrice de comparaison des stacks](annexes/A2-comparaison-stacks.md)
- [A3 — Catalogue initial des catégories de demandes](annexes/A3-categories-demandes.md)
- [A4 — Modèles de courriels transactionnels](annexes/A4-modeles-courriels.md)

## Convention de lecture

- Les exigences sont identifiées par un code de la forme `[EXG-NN-XXX]` où `NN` est le numéro de chapitre et `XXX` un compteur.
- Les niveaux de priorité d'exigence utilisent **MoSCoW** :
  - **MUST** : exigence indispensable au MVP, bloquante.
  - **SHOULD** : exigence forte, à inclure sauf contrainte démontrée.
  - **COULD** : exigence souhaitable, négociable au MVP.
  - **WONT** : explicitement hors périmètre MVP (V2 ou ultérieur).
- Les zones marquées `[À ARBITRER]` ou `[À DÉFINIR]` requièrent une décision avant la phase de conception détaillée.
