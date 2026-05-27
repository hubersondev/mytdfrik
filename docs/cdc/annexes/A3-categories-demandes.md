# A3 — Catalogue initial des catégories de demandes

Ce catalogue est une **proposition de démarrage**. Il est entièrement gérable par l'Administrateur depuis l'interface (chapitre 03 §3.12) et peut évoluer sans déploiement.

## A3.1 Structure d'une catégorie

Chaque catégorie porte les attributs définis au chapitre 08 §8.4.4 :

| Attribut | Valeur |
|---|---|
| `code` | identifiant stable, en MAJUSCULES_AVEC_TIRETS_BAS |
| `label` | libellé affiché au Client |
| `default_priority_id` | `P0` à `P4` |
| `requires_bug_details` | `true` si la catégorie déclenche le formulaire structuré bug du chapitre 06 |
| `default_responsible_team` | indicatif, libellé d'équipe |
| `is_reserved` | `true` si la catégorie n'est visible qu'à certains clients (V2) |
| `is_active` | `true` par défaut |

## A3.2 Catalogue proposé pour le démarrage

### A3.2.1 Catégories techniques

| Code | Libellé | Priorité défaut | Bug structuré | Équipe par défaut |
|---|---|:---:|:---:|---|
| `BUG_BLOCANT` | Signalement d'un bug bloquant | P1 | ✅ | Support technique |
| `BUG_NON_BLOCANT` | Signalement d'un bug non bloquant | P3 | ✅ | Support technique |
| `PANNE` | Panne ou indisponibilité | P1 | ✅ | Support technique |
| `INCIDENT_SECURITE` | Incident de sécurité | P0 | ✅ | Sécurité & IT |
| `DEMANDE_TECHNIQUE` | Question technique sur un produit | P3 | ❌ | Support technique |

### A3.2.2 Catégories fonctionnelles

| Code | Libellé | Priorité défaut | Bug structuré | Équipe par défaut |
|---|---|:---:|:---:|---|
| `DEMANDE_INFORMATION` | Demande d'information | P3 | ❌ | Support fonctionnel |
| `DEMANDE_DOCUMENTATION` | Demande de documentation | P4 | ❌ | Support fonctionnel |
| `EVOLUTION` | Demande d'évolution / nouvelle fonctionnalité | P4 | ❌ | Comité produit |
| `FORMATION` | Demande de formation ou d'accompagnement | P4 | ❌ | Service formation |

### A3.2.3 Catégories commerciales et administratives

| Code | Libellé | Priorité défaut | Bug structuré | Équipe par défaut |
|---|---|:---:|:---:|---|
| `RECLAMATION` | Réclamation commerciale | P2 | ❌ | Direction commerciale |
| `DEMANDE_DEVIS` | Demande de devis | P3 | ❌ | Service commercial |
| `FACTURATION` | Question liée à la facturation | P3 | ❌ | Service comptable |
| `RESILIATION` | Demande de résiliation ou modification de contrat | P2 | ❌ | Direction commerciale |

### A3.2.4 Catégorie générique

| Code | Libellé | Priorité défaut | Bug structuré | Équipe par défaut |
|---|---|:---:|:---:|---|
| `AUTRE` | Autre demande | P3 | ❌ | Support fonctionnel |

## A3.3 Champs de formulaire adaptatif suggérés

Pour les catégories sans formulaire bug structuré, le formulaire de soumission propose les champs suivants en complément des champs obligatoires communs (titre, description, impact, urgence, contexte particulier, pièces jointes) :

| Catégorie | Champs spécifiques additionnels |
|---|---|
| `DEMANDE_INFORMATION` | Domaine concerné (sélection libre paramétrable). |
| `DEMANDE_DEVIS` | Référence produit/service souhaité, quantité estimative, délai souhaité. |
| `FACTURATION` | Numéro de facture concerné, période, montant en litige. |
| `RECLAMATION` | Date de l'événement, services concernés, attentes du Client. |
| `EVOLUTION` | Produit concerné, problème actuel adressé, bénéfice attendu. |
| `FORMATION` | Public visé, niveau attendu, disponibilité souhaitée. |
| `RESILIATION` | Contrat concerné, date d'effet souhaitée, motif. |

> **[EXG-A3-001] (SHOULD)** L'éditeur de formulaires adaptatifs au sein de l'administration est livré dans une version simple au MVP (liste de champs prédéfinis activables/désactivables par catégorie). Un constructeur générique de formulaires est WONT au MVP.

## A3.4 Catalogue de produits indicatif

Le catalogue de produits référencés par les bugs (`products`, voir chapitre 08 §8.4.8) doit être préalablement renseigné par l'Administrateur **avant l'ouverture aux Clients**. Format de la grille à initialiser :

| `code` | `label` | `requires_os` | `requires_browser` | `default_owner_team` |
|---|---|:---:|:---:|---|
| `TDFK_ONLINE` | Portail TDFK Online | ❌ | ✅ | Équipe Web |
| `TDFK_DESKTOP` | Application bureau TDFK | ✅ | ❌ | Équipe Desktop |
| `TDFK_API` | API B2B TDFK | ❌ | ❌ | Équipe API |
| ... | ... | ... | ... | ... |

> **[EXG-A3-010] (MUST)** La liste exhaustive et à jour des produits TECHDIFRIK est récupérée auprès du Département Produit avant la mise en production.
