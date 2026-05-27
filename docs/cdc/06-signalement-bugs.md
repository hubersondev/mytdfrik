# 06 — Signalement et suivi des bugs

L'activité de TECHDIFRIK reposant majoritairement sur la fourniture de produits et services techniques, le signalement structuré des dysfonctionnements constitue un pilier fonctionnel de la plateforme. Il est traité comme un canal de premier plan dès le MVP, et non comme une simple sous-catégorie de demande.

## 6.1 Deux périmètres distincts de signalement

| Périmètre | Canal | Destinataire | Objet |
|---|---|---|---|
| **Bugs des produits/services TECHDIFRIK** | MyTDFRIK (catégorie « Signalement de bug ») | Gestionnaire → Responsable technique | Cas principal, objet du présent chapitre. |
| **Bugs de la plateforme MyTDFRIK elle-même** | Canal de secours indépendant | Équipe IT TECHDIFRIK | Doit rester accessible y compris si MyTDFRIK est indisponible. |

### 6.1.1 Canal de secours pour la plateforme

- **[EXG-06-001] (MUST)** Le canal de secours est constitué de :
  1. Une adresse courriel dédiée `support-mytdfrik@techdifrik.com` [À VALIDER].
  2. Une page de statut publique hébergée séparément de la plateforme (sous-domaine ou service tiers de type Uptime/Statuspage), affichant la disponibilité courante de MyTDFRIK et les incidents en cours.
- **[EXG-06-002] (MUST)** La page de statut publique n'est jamais hébergée sur la même infrastructure que MyTDFRIK. En cas d'incident majeur, elle reste accessible.
- **[EXG-06-003] (SHOULD)** Le pied de page de l'application MyTDFRIK affiche un lien permanent vers la page de statut.
- **[EXG-06-004] (SHOULD)** Une page d'erreur 503 personnalisée est servie en cas d'indisponibilité, mentionnant l'adresse courriel de secours et le lien vers la page de statut.

## 6.2 Formulaire structuré de signalement de bug

Lorsque le Client sélectionne la catégorie « Signalement de bug » à la création d'une demande, le formulaire adaptatif suivant lui est présenté **en plus** des champs communs (impact, urgence, contexte particulier).

### 6.2.1 Champs spécifiques au formulaire bug

| Champ | Type | Obligatoire | Description / Règles |
|---|---|:---:|---|
| `product_id` | sélection (catalogue) | ✅ | Produit ou service TECHDIFRIK concerné. Catalogue géré par l'Administrateur. |
| `product_version` | texte (60 max) | ✅ | Version ou référence du produit. Auto-complétion à partir du catalogue si versionning standardisé. |
| `expected_behavior` | texte (2000 max) | ✅ | Ce que le Client souhaitait obtenir. |
| `observed_behavior` | texte (2000 max) | ✅ | Ce qui s'est réellement produit. |
| `reproduction_steps` | texte (3000 max) | ✅ | Étapes pour reproduire le problème, formatées en liste numérotée recommandée. |
| `occurred_at` | datetime | ✅ | Date et heure d'apparition du dysfonctionnement (le Client peut indiquer « première fois constaté » ou « récurrent »). |
| `is_recurrent` | booléen | ✅ | Indique si le bug est récurrent ou ponctuel. |
| `frequency_label` | sélection (4 valeurs) | si `is_recurrent = true` | `À chaque utilisation` / `Plusieurs fois par jour` / `Plusieurs fois par semaine` / `Occasionnel`. |
| `environment_os` | sélection | ⚠️ | Système d'exploitation (Windows 10, 11, macOS, Linux, Android, iOS, autre). Obligatoire pour les produits applicatifs ; masqué pour les services SaaS purement web. |
| `environment_browser` | sélection | ⚠️ | Navigateur et version. Pré-rempli à partir de l'agent utilisateur, modifiable. Obligatoire pour les produits web. |
| `environment_hardware` | texte (300 max) | ❌ | Configuration matérielle si pertinent. |
| `is_blocking` | booléen | ✅ | Le bug bloque-t-il votre activité ? (oui/non). Sert à pondérer la priorisation. |
| `error_messages` | texte (2000 max) | ❌ | Messages d'erreur affichés textuellement (utile pour les recherches dans le code et les logs). |
| `attachments` | pièces jointes | ❌ | Captures d'écran, vidéos, journaux d'erreur, fichiers exemples. Mêmes règles que §3.8. |

> **[EXG-06-010] (MUST)** Les champs marqués `⚠️` sont obligatoires conditionnellement : leur exigence dépend des métadonnées du produit sélectionné (`requires_os`, `requires_browser`).

### 6.2.2 Pondération de priorité spécifique aux bugs

- **[EXG-06-020] (MUST)** Si `is_blocking = true`, alors l'impact métier déclaré est contraint à `BLOCAGE_TOTAL` ou `BLOCAGE_PARTIEL`. Sinon, tous les niveaux d'impact restent disponibles.
- **[EXG-06-021] (MUST)** Les catégories liées aux bugs portent une `default_priority` adaptée (généralement P2 pour un bug standard, P1 pour un bug bloquant produit critique). Le mécanisme général du chapitre 05 §5.4.1 s'applique.

## 6.3 Cycle de traitement spécifique aux bugs

Le cycle de vie d'un bug suit la machine à états du chapitre 04, avec quelques spécificités opérationnelles :

### 6.3.1 Qualification renforcée par le Gestionnaire

Lors de la qualification (T02), le Gestionnaire effectue trois contrôles supplémentaires :

- **[EXG-06-030] (MUST)** Confirmer qu'il s'agit bien d'un bug (et non d'une incompréhension fonctionnelle ou d'une demande d'évolution déguisée). Si la nature réelle est différente, le Gestionnaire reclasse la catégorie en justifiant.
- **[EXG-06-031] (MUST)** Rechercher si un signalement similaire existe déjà (par produit, version, mots-clés des champs observed_behavior / error_messages). Si oui, fusionner ou rattacher.
- **[EXG-06-032] (MUST)** Affecter à un Responsable **technique** compétent sur le produit concerné. Le catalogue produit porte une affectation indicative `default_owner_team`.

### 6.3.2 Diagnostic et reproduction par le Responsable

- **[EXG-06-040] (MUST)** Avant de proposer une résolution, le Responsable doit consigner dans la fiche :
  - Si le bug a été **reproduit** dans son environnement (`is_reproduced` : oui/non/partiel).
  - La **cause identifiée** (`root_cause`, texte libre).
  - L'**action corrective** appliquée ou prévue (`corrective_action`, texte libre).
  - Le cas échéant, le **contournement** proposé au Client en attendant la correction (`workaround`, texte libre).

### 6.3.3 Validation par le Client

- **[EXG-06-050] (MUST)** Lors de la transition T11 (proposition de clôture), le Responsable indique explicitement si le correctif a été **déployé** (`fix_deployed`) ou si la résolution consiste en un contournement (`workaround_only`).
- **[EXG-06-051] (MUST)** Le Client doit valider que le correctif résout effectivement le problème (T16). En cas de refus (T18), le bug repart en `EN_COURS` avec un commentaire de refus.

### 6.3.4 Communication transparente

- **[EXG-06-060] (MUST)** Le Client est notifié à chaque étape clé : bug confirmé (`is_reproduced = oui`), en cours de correction, correctif déployé, fermeture. Les libellés des notifications sont adaptés au contexte « bug » (voir chapitre 07).

## 6.4 Capitalisation et amélioration continue

Le signalement structuré alimente une boucle d'amélioration continue.

### 6.4.1 Métriques qualité produit (alimentent les indicateurs DG)

- **[EXG-06-070] (MUST)** Pour chaque produit, le système calcule :
  - Nombre de bugs signalés sur la période (et par version).
  - Taux de bugs reproduits (utile pour détecter les rapports difficiles à exploiter).
  - Délai moyen de correction (création → `fix_deployed`).
  - Top 10 des bugs récurrents (regroupement par `observed_behavior` + `product_id` + `product_version`).
  - Taux de récurrence après clôture (un bug est récurrent si un nouveau ticket sur le même produit/version mentionne un comportement similaire dans les 90 jours).

### 6.4.2 Base de connaissances interne

- **[EXG-06-080] (MUST)** Toute fiche de bug clôturée comportant un `root_cause` et un `corrective_action` documentés est marquée comme **réutilisable** et indexée dans une base de connaissances interne consultable par tous les Responsables.
- **[EXG-06-081] (MUST)** Lors du diagnostic d'un nouveau bug, le Responsable voit suggérés en lecture seule les bugs similaires déjà résolus (par produit, version et mots-clés).
- **[EXG-06-082] (SHOULD)** Le Responsable peut explicitement marquer une fiche comme « cas d'école » pour la mettre en avant dans la base.
- **[EXG-06-083] (WONT au MVP)** L'exposition de cette base de connaissances aux Clients (FAQ libre-service) est une fonctionnalité V2 (chapitre 01 §1.4.2).

### 6.4.3 Rapports qualité par produit

- **[EXG-06-090] (SHOULD)** Un rapport périodique (mensuel) par produit est généré automatiquement et accessible au tableau de bord DG.
- **[EXG-06-091] (COULD)** Le rapport peut être exporté en PDF.

## 6.5 Intégration avec les outils techniques (V2)

> **[EXG-06-100] (WONT au MVP)**

Il est recommandé qu'en version 2, MyTDFRIK soit intégré à un outil de suivi de bugs interne (Jira, GitHub Issues ou équivalent) afin que les tickets de catégorie « Bug » soient automatiquement transmis aux équipes de développement produit, sans ressaisie.

L'intégration prévue répondra aux exigences suivantes :

- **[EXG-06-101] (V2)** Lors du passage d'un bug en statut `AFFECTEE` à une équipe de développement, un ticket miroir est créé automatiquement dans l'outil cible avec mapping des champs (titre, description, étapes de repro, environnement, pièces jointes).
- **[EXG-06-102] (V2)** Le statut du ticket de développement remonte de manière transparente vers le ticket MyTDFRIK (`En cours de développement`, `Correctif en revue`, `Correctif déployé`).
- **[EXG-06-103] (V2)** Les commentaires côté outil dev sont synchronisés vers la messagerie interne MyTDFRIK (non visibles du Client), avec marquage explicite « depuis Jira ».
- **[EXG-06-104] (V2)** Le Client continue de voir une vue unifiée et n'a pas conscience de l'outil dev sous-jacent.

L'architecture pour la V2 doit donc anticiper, dès le MVP :

- **[EXG-06-110] (SHOULD)** Tous les champs du formulaire bug doivent être typés et structurés pour permettre un mapping automatique sans transformation manuelle.
- **[EXG-06-111] (SHOULD)** Le modèle de données prévoit un champ `external_tracker_ref` (nullable) sur les bugs, qui sera utilisé en V2 sans migration de schéma.

## 6.6 Récapitulatif des champs spécifiques aux bugs sur la demande

En complément des champs communs (chapitres 03 et 05), une demande de catégorie « Signalement de bug » porte :

| Champ | Type | Renseigné par | Note |
|---|---|---|---|
| `product_id`, `product_version`, `expected_behavior`, `observed_behavior`, `reproduction_steps`, `occurred_at`, `is_recurrent`, `frequency_label`, `environment_*`, `is_blocking`, `error_messages` | (voir §6.2) | Client | Soumission |
| `is_reproduced` | enum (oui/non/partiel/non testé) | Responsable | Diagnostic |
| `root_cause` | texte (3000 max) | Responsable | Diagnostic |
| `corrective_action` | texte (3000 max) | Responsable | Résolution |
| `workaround` | texte (2000 max) | Responsable | Optionnel |
| `fix_deployed` | booléen | Responsable | À T11 |
| `workaround_only` | booléen | Responsable | À T11, si `fix_deployed = false` |
| `is_knowledge_base_eligible` | booléen | Système (auto) ou Responsable (override) | Indexe la fiche dans la base de connaissances |
| `external_tracker_ref` | texte (300 max), nullable | (V2 — non utilisé au MVP) | Lien vers le ticket dev externe |
