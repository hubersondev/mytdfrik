# 05 — Priorisation (matrice Impact × Urgence)

## 5.1 Principes directeurs

Le mécanisme de priorisation de MyTDFRIK est conçu pour résoudre un problème opérationnel récurrent : laissée à la libre appréciation du client, la priorité dérive systématiquement vers le haut ; toutes les demandes deviennent « urgentes » et la file d'attente perd sa capacité de tri.

La solution retenue est inspirée du référentiel **ITIL** et applique quatre principes invariants :

| # | Principe | Application |
|---|---|---|
| P1 | Le Client ne fixe pas la priorité. | Aucun champ « priorité » saisissable côté Client. |
| P2 | Le Client décrit son contexte par des éléments factuels et vérifiables. | Catégorie, impact métier déclaré, urgence métier déclarée, description, contexte libre. |
| P3 | Le système calcule automatiquement une priorité initiale. | Algorithme déterministe basé sur la catégorie et les déclarations Client (§5.4). |
| P4 | Le Gestionnaire valide ou ajuste avec justification. | Override traçable avec motif obligatoire (§5.5). |

> **[EXG-05-001] (MUST)** Aucune interface ni API ne doit permettre à un Client de fixer ou modifier directement le champ `priority` d'une demande.

## 5.2 Données collectées auprès du Client

Lors de la création d'une demande, le Client renseigne quatre éléments contribuant au calcul :

### 5.2.1 Catégorie de demande

- **[EXG-05-010] (MUST)** Le Client choisit une catégorie parmi le catalogue géré par l'Administrateur (annexe A3).
- **[EXG-05-011] (MUST)** Chaque catégorie porte une **priorité par défaut** (`default_priority`) utilisée comme valeur de référence avant ajustement par la matrice.

### 5.2.2 Impact métier

Le Client déclare l'impact métier de la situation à partir d'une liste fermée à 4 valeurs, avec définition explicite affichée à l'écran :

| Valeur (interne) | Libellé Client | Définition exposée au Client |
|---|---|---|
| `BLOCAGE_TOTAL` | Service totalement bloqué | « L'activité concernée est totalement à l'arrêt. Aucun contournement n'est possible. Plusieurs utilisateurs ou processus métier sont impactés. » |
| `BLOCAGE_PARTIEL` | Service partiellement bloqué | « Une partie significative de l'activité ne fonctionne pas. Un contournement existe mais reste coûteux ou risqué. » |
| `DEGRADATION` | Fonctionnement dégradé | « L'activité est ralentie ou perturbée mais reste possible. Un contournement simple permet de continuer. » |
| `AUCUN_IMPACT` | Aucun impact opérationnel | « La situation est gênante ou inconfortable, mais n'affecte pas l'activité opérationnelle. » |

- **[EXG-05-020] (MUST)** L'impact métier est obligatoire à la création.
- **[EXG-05-021] (MUST)** La sélection présente la définition complète au Client (info-bulle ou bloc explicatif), afin d'éviter les déclarations excessives par malentendu.

### 5.2.3 Urgence métier

Le Client déclare l'urgence métier perçue à partir d'une liste fermée à 4 valeurs, avec définition explicite :

| Valeur (interne) | Libellé Client | Définition exposée au Client |
|---|---|---|
| `CRITIQUE` | Critique | « Le besoin doit être traité immédiatement. Toute heure supplémentaire produit un préjudice important (pertes financières, manquement contractuel, atteinte à la réputation). » |
| `ELEVEE` | Élevée | « Le besoin doit être traité dans la journée. Au-delà, le préjudice devient significatif. » |
| `MODEREE` | Modérée | « Le besoin doit être traité dans la semaine. Au-delà, l'inconfort augmente sans préjudice immédiat. » |
| `FAIBLE` | Faible | « Le besoin peut attendre. Il s'agit d'une amélioration souhaitée sans contrainte temporelle. » |

- **[EXG-05-030] (MUST)** L'urgence métier est obligatoire à la création.
- **[EXG-05-031] (MUST)** Les définitions sont affichées de la même manière que pour l'impact (info-bulles ou bloc explicatif).

### 5.2.4 Contexte particulier (champ libre)

- **[EXG-05-040] (MUST)** Le Client peut renseigner un **champ libre** « Contexte particulier » d'au maximum 500 caractères, pour exprimer une contrainte qualitative (échéance spécifique, événement client, dépendance externe).
- **[EXG-05-041] (MUST)** Ce champ est purement informationnel et **ne participe pas au calcul automatique** de la priorité. Il est lu et pris en compte par le Gestionnaire lors de la validation/ajustement.

## 5.3 Cinq niveaux de priorité système

| Code | Libellé | Description |
|---|---|---|
| `P0` | Bloquant | Crise. Mobilisation immédiate, escalade automatique au Gestionnaire et à l'équipe d'astreinte. |
| `P1` | Critique | Très haute priorité. Traitement prioritaire en heures ouvrées. |
| `P2` | Haute | Priorité élevée. Doit être traité avant les demandes routinières. |
| `P3` | Normale | Priorité courante. Traitement dans le cours normal des activités. |
| `P4` | Basse | Faible priorité. Traitement quand la charge le permet. |

## 5.4 Matrice de calcul Impact × Urgence

La priorité système est calculée par croisement de l'impact et de l'urgence métier déclarés par le Client, selon la matrice ci-dessous :

| Impact \\ Urgence | Faible | Modérée | Élevée | Critique |
|---|:---:|:---:|:---:|:---:|
| **Service totalement bloqué** | P2 | P1 | P1 | **P0** |
| **Service partiellement bloqué** | P3 | P2 | P2 | P1 |
| **Fonctionnement dégradé** | P4 | P3 | P2 | P2 |
| **Aucun impact opérationnel** | P4 | P4 | P3 | P3 |

> **[EXG-05-050] (MUST)** Cette matrice est appliquée par un service côté serveur. Son résultat est stocké dans la demande comme `system_priority` et n'est jamais modifiable a posteriori (la modification par le Gestionnaire s'inscrit dans le champ séparé `effective_priority`, voir §5.5).

### 5.4.1 Pondération de la catégorie

Certaines catégories de demandes ont un comportement spécifique qui justifie un ajustement automatique :

- **[EXG-05-051] (MUST)** Si la `default_priority` de la catégorie est plus prioritaire (chiffre plus bas : P0 < P1 < P2 < P3 < P4) que la priorité calculée par la matrice, alors `system_priority = min(matrice, default_priority)`.
- **[EXG-05-052] (MUST)** Si la `default_priority` est moins prioritaire que la matrice, c'est le résultat de la matrice qui l'emporte. La catégorie ne peut donc qu'élever la priorité, jamais l'abaisser.

Exemple : une demande de catégorie « Sécurité » avec `default_priority = P1`, impact `Fonctionnement dégradé` et urgence `Faible` (matrice = P4) donne `system_priority = P1`.

## 5.5 Validation et ajustement par le Gestionnaire

- **[EXG-05-060] (MUST)** Lors de la qualification (transition T02 du chapitre 04), le Gestionnaire voit la `system_priority` calculée et peut soit la valider telle quelle, soit l'ajuster.
- **[EXG-05-061] (MUST)** L'ajustement est borné : le Gestionnaire peut au maximum changer d'**un niveau** vers le haut ou le bas (par exemple, P3 → P2 ou P3 → P4). Pour un changement plus marqué, une demande à l'Administrateur est requise (`Demande d'override fort`, journalisée).
- **[EXG-05-062] (MUST)** Tout ajustement, même d'un niveau, impose la saisie d'un **motif obligatoire** (texte libre, 10 à 500 caractères) visible par le Client et conservé dans l'historique.
- **[EXG-05-063] (MUST)** La priorité résultante est stockée dans `effective_priority`. C'est cette valeur qui est utilisée par les tableaux de bord, le tri des files d'attente et les calculs de SLA.
- **[EXG-05-064] (MUST)** Si le Gestionnaire ne touche pas à la priorité, `effective_priority = system_priority` et l'historique mentionne `Priorité système confirmée`.

## 5.6 Engagements de service (SLA) par priorité

Les engagements ci-dessous sont **proposés** et **doivent être validés par la Direction Générale** avant le démarrage. Ils sont conservés en base et paramétrables par l'Administrateur (chapitre 03 §3.12).

### 5.6.1 Délai cible de prise en charge

Temps maximum entre la soumission (création) et la **première action qualifiée** d'un Gestionnaire (transition T02).

| Priorité | Délai cible de prise en charge | Heures ouvrées ou calendaires ? |
|---|---|---|
| P0 — Bloquant | **30 minutes** | Calendaires, 24/7 |
| P1 — Critique | **2 heures** | Heures ouvrées |
| P2 — Haute | **4 heures** | Heures ouvrées |
| P3 — Normale | **1 jour ouvré** | Heures ouvrées |
| P4 — Basse | **3 jours ouvrés** | Heures ouvrées |

### 5.6.2 Délai cible de résolution

Temps maximum entre la soumission et la résolution proposée (transition T11), hors temps passé en `EN_ATTENTE_CLIENT`.

| Priorité | Délai cible de résolution |
|---|---|
| P0 — Bloquant | **4 heures** calendaires |
| P1 — Critique | **1 jour ouvré** |
| P2 — Haute | **3 jours ouvrés** |
| P3 — Normale | **5 jours ouvrés** |
| P4 — Basse | **15 jours ouvrés** |

### 5.6.3 Référentiel d'heures ouvrées

- **[EXG-05-070] (MUST)** Heures ouvrées par défaut : **lundi-vendredi, 8h00-18h00** (heure d'Abidjan, UTC). Les jours fériés ivoiriens officiels sont exclus.
- **[EXG-05-071] (MUST)** Les périodes d'astreinte 24/7 ne concernent au MVP **que la priorité P0**. La constitution effective de l'équipe d'astreinte relève d'un processus interne hors périmètre de cette spécification.
- **[EXG-05-072] (SHOULD)** L'Administrateur peut surcharger le calendrier ouvré et la liste des jours fériés.

## 5.7 Indicateur de respect SLA

- **[EXG-05-080] (MUST)** Pour chaque demande clôturée, le système calcule deux booléens dérivés : `sla_prise_en_charge_respectee`, `sla_resolution_respectee`.
- **[EXG-05-081] (MUST)** Les indicateurs DG (chapitre 03 §3.11.2) agrègent ces booléens en taux de respect par priorité et par période.
- **[EXG-05-082] (WONT au MVP)** Les **alertes proactives** avant dépassement (par exemple : 80 % du SLA consommé) sont reportées en V2. Le MVP mesure ; il n'alerte pas en temps réel sur les dépassements imminents.

## 5.8 Récapitulatif des champs stockés sur la demande

| Champ | Type | Renseigné par | Modifiable par | Description |
|---|---|---|---|---|
| `category_id` | FK | Client (à la création) | Gestionnaire (qualification) | Catégorie de la demande. |
| `impact` | enum (4 valeurs) | Client | (Non modifiable) | Impact métier déclaré. |
| `urgency` | enum (4 valeurs) | Client | (Non modifiable) | Urgence métier déclarée. |
| `client_context_note` | texte (500 max) | Client | (Non modifiable) | Champ libre contextuel. |
| `system_priority` | enum (P0-P4) | Système (calcul) | (Non modifiable) | Résultat brut de la matrice + pondération catégorie. |
| `effective_priority` | enum (P0-P4) | Gestionnaire ou Système | Gestionnaire (avec motif) | Priorité utilisée pour le tri et les SLA. |
| `priority_override_reason` | texte (500 max) | Gestionnaire | Gestionnaire | Motif d'ajustement (obligatoire si `effective_priority ≠ system_priority`). |
| `sla_due_first_response_at` | datetime | Système (à T02) | (Non modifiable) | Échéance théorique de première réponse. |
| `sla_due_resolution_at` | datetime | Système (à T02) | (Non modifiable, sauf recalcul après réouverture) | Échéance théorique de résolution. |
