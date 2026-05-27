# 09 — API REST

## 9.1 Principes

- **[EXG-09-001] (MUST)** L'API est REST sur JSON. Pas de SOAP, pas de GraphQL au MVP.
- **[EXG-09-002] (MUST)** Préfixe de version dans le chemin : `/api/v1`. Une éventuelle V2 ne casse pas la V1 sur la même durée de support (12 mois minimum après publication de la V2).
- **[EXG-09-003] (MUST)** Format JSON UTF-8 ; en-tête `Content-Type: application/json` pour les écritures.
- **[EXG-09-004] (MUST)** Tous les endpoints d'écriture nécessitent un jeton JWT valide en `Authorization: Bearer <token>`. Seuls les endpoints d'authentification publics y dérogent.
- **[EXG-09-005] (MUST)** Les autorisations métier (matrice du chapitre 02 §2.3) sont validées **systématiquement côté serveur**. L'absence d'éléments dans une liste pour cause d'autorisation se traduit par un masquage transparent, jamais par un 403.
- **[EXG-09-006] (MUST)** Les ressources sont identifiées par UUID dans les chemins (`/requests/{request_id}`), à l'exception de `public_reference` qui peut être utilisé en alternative documentée.
- **[EXG-09-007] (MUST)** Les noms de ressources sont au **pluriel** et en `kebab-case` quand multi-mot (`/request-attachments`).
- **[EXG-09-008] (MUST)** Verbes HTTP standard : `GET`, `POST`, `PATCH`, `DELETE`. `PUT` réservé aux remplacements complets, peu utilisé.

## 9.2 Conventions transverses

### 9.2.1 Format d'erreur uniforme

Toute erreur API retourne un corps JSON :

```json
{
  "error": {
    "code": "REQUEST_NOT_FOUND",
    "message": "La demande spécifiée n'existe pas ou vous n'y avez pas accès.",
    "details": {
      "request_id": "…"
    },
    "trace_id": "01HXYZ…"
  }
}
```

- **[EXG-09-010] (MUST)** `code` est une chaîne stable (référence pour le code client). `message` est destiné à l'utilisateur final, localisé en français. `trace_id` permet à un Administrateur de retrouver le contexte dans les logs.
- **[EXG-09-011] (MUST)** Liste des codes principaux maintenue dans `docs/api-errors.md` (à créer côté implémentation).

### 9.2.2 Codes HTTP utilisés

| Code | Sens |
|---|---|
| 200 | Succès lecture ou action sans création. |
| 201 | Création réussie. `Location:` pointe vers la ressource. |
| 204 | Succès sans corps (suppression, transition simple sans payload retour). |
| 400 | Requête malformée (JSON invalide, champ manquant, type incorrect). |
| 401 | Non authentifié. |
| 403 | Authentifié mais non autorisé. |
| 404 | Ressource introuvable ou masquée par autorisation. |
| 409 | Conflit (état attendu non respecté ; cf. chapitre 04 §4.4 [EXG-04-012]). |
| 410 | Ressource supprimée définitivement. |
| 413 | Charge utile trop volumineuse (pièce jointe > 25 Mo). |
| 415 | Type média non supporté. |
| 422 | Validation métier en erreur (cas distinct du 400 syntaxique). |
| 429 | Limite de débit atteinte (voir §9.7). |
| 500 | Erreur serveur non gérée. |
| 503 | Indisponibilité contrôlée (maintenance). |

### 9.2.3 Pagination, filtrage et tri

- **[EXG-09-020] (MUST)** Toute liste utilise une pagination par **curseur** (`cursor`-based), pas par offset. Format de réponse :

```json
{
  "items": [ ... ],
  "page_info": {
    "next_cursor": "eyJ0Ijo…",
    "has_next": true
  }
}
```

- **[EXG-09-021] (MUST)** Taille par défaut : 25 ; maximum : 100. Paramètre `limit` requis pour s'écarter du défaut.
- **[EXG-09-022] (MUST)** Le tri se déclare via `sort=` avec syntaxe `?sort=-created_at,priority` (le `-` indique l'ordre décroissant). Seuls les champs explicitement autorisés sont triables.
- **[EXG-09-023] (MUST)** Le filtrage se déclare via des paramètres de requête typés. Exemple : `?status=NOUVELLE,AFFECTEE&priority=P0,P1&category_code=BUG`. La sémantique multi-valeur est l'union (OR).
- **[EXG-09-024] (SHOULD)** Filtre temporel : `?created_after=2026-05-01T00:00:00Z&created_before=...`.

### 9.2.4 Idempotence

- **[EXG-09-030] (MUST)** Les requêtes `POST` créant une ressource acceptent un en-tête `Idempotency-Key: <uuid>` permettant la réémission sans création de doublon (cache de réponse 24h côté serveur).
- **[EXG-09-031] (MUST)** Les transitions d'état (chapitre 04) sont **idempotentes** par rapport au statut cible attendu : appliquer T08 sur une demande déjà en `EN_COURS` ne crée pas de seconde transition ; l'API retourne 409 si le statut courant ne correspond pas au statut attendu.

## 9.3 Authentification

### 9.3.1 Modèle de jetons

- **[EXG-09-040] (MUST)** Authentification par **JWT court (15 min)** + **refresh token long (7 jours, glissant)**.
- **[EXG-09-041] (MUST)** Le refresh token est stocké côté serveur (hashé) dans `sessions` et révocable à la déconnexion ou à l'expiration.
- **[EXG-09-042] (MUST)** Le JWT contient au minimum : `sub` (user_id), `role`, `org_id` (si Client), `iat`, `exp`, `jti`. Pas de données sensibles.
- **[EXG-09-043] (MUST)** Algorithme : `RS256` (clé asymétrique, rotation tous les 12 mois) ou `HS256` avec secret stocké en gestionnaire de secrets (préférer `RS256` si possible).

### 9.3.2 Endpoints

| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | publique | Authentification par courriel + mot de passe. Retourne JWT + refresh token. |
| `POST` | `/api/v1/auth/refresh` | publique (refresh token) | Échange un refresh token contre un nouveau couple. |
| `POST` | `/api/v1/auth/logout` | requise | Révoque la session courante. |
| `POST` | `/api/v1/auth/logout-all` | requise | Révoque toutes les sessions de l'utilisateur. |
| `POST` | `/api/v1/auth/password-reset/request` | publique | Envoie un courriel avec lien de réinitialisation. Toujours répond 204 pour ne pas révéler l'existence du compte. |
| `POST` | `/api/v1/auth/password-reset/confirm` | publique (token) | Définit le nouveau mot de passe. |
| `POST` | `/api/v1/auth/activate` | publique (token) | Active un compte créé par l'Administrateur et définit le premier mot de passe. |

### 9.3.3 Exemple — `POST /api/v1/auth/login`

Requête :

```json
{
  "email": "client@example.com",
  "password": "********"
}
```

Réponse 200 :

```json
{
  "access_token": "eyJ…",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "rt_…",
  "user": {
    "id": "uuid",
    "email": "client@example.com",
    "first_name": "…",
    "last_name": "…",
    "role": "CLIENT",
    "organization_id": "uuid",
    "time_zone": "Africa/Abidjan"
  }
}
```

Réponse 401 (échec) :

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Identifiants invalides."
  }
}
```

> **[EXG-09-044] (MUST)** En cas de mauvais mot de passe ou de compte inexistant, retourner le **même** message générique (anti-énumération). Le compteur d'échecs est incrémenté en interne pour le verrouillage.

## 9.4 Demandes (`requests`)

### 9.4.1 Endpoints CRUD et listing

| Méthode | Chemin | Rôles | Description |
|---|---|---|---|
| `GET` | `/api/v1/requests` | tous | Liste les demandes accessibles au rôle. Filtres : `status`, `priority`, `category_code`, `assigned_to`, `organization_id`, `created_after`, `created_before`, `q` (recherche full-text). |
| `POST` | `/api/v1/requests` | Client | Crée une demande. |
| `GET` | `/api/v1/requests/{id}` | tous | Détail d'une demande (avec masquage des messages internes pour le Client). |
| `GET` | `/api/v1/requests/by-reference/{public_reference}` | tous | Lookup par référence humaine `MTF-…`. |
| `PATCH` | `/api/v1/requests/{id}` | Gestionnaire (qualification), Responsable (champs limités) | Met à jour catégorie, priorité, contenu (selon rôle). |
| (pas de `DELETE`) | — | — | Une demande n'est jamais supprimée par l'API ; seule l'annulation (transition) est exposée. |

### 9.4.2 Transitions de cycle de vie

> Pattern d'URL : `POST /api/v1/requests/{id}/transitions/{transition_code}`.

Chaque transition retourne 200 avec la demande mise à jour, ou 409 si l'état n'autorise pas la transition, ou 403 si le rôle n'est pas habilité.

| Transition | Endpoint | Rôle | Payload |
|---|---|---|---|
| T02 (qualifier) | `POST /requests/{id}/transitions/qualify` | Gestionnaire | `{"effective_priority":"P2","override_reason":"…","category_id":"uuid"}` |
| T03 (demander complément) | `POST /requests/{id}/transitions/request-info` | Gestionnaire ou Responsable | `{"message_body":"…"}` |
| T04 (annuler) | `POST /requests/{id}/transitions/cancel` | Client | `{"reason":"…"}` |
| T05 (rejeter) | `POST /requests/{id}/transitions/reject` | Gestionnaire | `{"reason":"…"}` |
| T06 (affecter) | `POST /requests/{id}/transitions/assign` | Gestionnaire | `{"assignee_user_id":"uuid"}` |
| T08 (prendre en charge) | `POST /requests/{id}/transitions/start` | Responsable | `{}` |
| T09 (refuser affectation) | `POST /requests/{id}/transitions/refuse-assignment` | Responsable | `{"reason":"…"}` |
| T11 (proposer résolution) | `POST /requests/{id}/transitions/propose-resolution` | Responsable | `{"resolution_summary":"…","fix_deployed":true,"workaround_only":false}` |
| T12 (demander réaffectation) | `POST /requests/{id}/transitions/request-reassignment` | Responsable | `{"reason":"…"}` |
| T16 (valider clôture) | `POST /requests/{id}/transitions/validate-resolution` | Client | `{}` |
| T18 (refuser clôture) | `POST /requests/{id}/transitions/refuse-resolution` | Client | `{"reason":"…"}` |
| T19 (réouvrir) | `POST /requests/{id}/transitions/reopen` | Client | `{"reason":"…"}` |

> **[EXG-09-050] (MUST)** Chaque transition accepte un en-tête `If-Match: <status>` correspondant au statut attendu pour gestion de la concurrence ([EXG-04-070]).

### 9.4.3 Exemple — `POST /api/v1/requests`

Requête (Client, catégorie « Bug ») :

```json
{
  "category_code": "BUG",
  "title": "Erreur 500 à la connexion au portail TDFK Online",
  "description": "Depuis ce matin, impossible de se connecter au portail.",
  "impact": "BLOCAGE_TOTAL",
  "urgency": "CRITIQUE",
  "client_context_note": "Bilan trimestriel à clôturer aujourd'hui.",
  "bug_details": {
    "product_code": "TDFK_ONLINE",
    "product_version": "3.4.2",
    "expected_behavior": "Connexion réussie après saisie identifiant et mot de passe.",
    "observed_behavior": "Page d'erreur 500 affichée après quelques secondes.",
    "reproduction_steps": "1. Aller sur https://portal.tdfk.com\n2. Saisir identifiants\n3. Cliquer sur 'Se connecter'",
    "occurred_at": "2026-05-26T08:30:00Z",
    "is_recurrent": true,
    "frequency_label": "À chaque utilisation",
    "environment_os": "Windows 11",
    "environment_browser": "Chrome 124",
    "is_blocking": true,
    "error_messages": "Internal Server Error - Reference: 8f1c…"
  },
  "attachment_ids": ["uuid-1"]
}
```

Réponse 201 :

```json
{
  "id": "uuid",
  "public_reference": "MTF-20260526-0042",
  "status": "NOUVELLE",
  "system_priority": "P0",
  "effective_priority": "P0",
  "created_at": "2026-05-26T08:32:11Z",
  "sla_due_first_response_at": "2026-05-26T09:02:11Z",
  "sla_due_resolution_at": "2026-05-26T12:32:11Z",
  ...
}
```

## 9.5 Sous-ressources d'une demande

### 9.5.1 Messages

| Méthode | Chemin | Description |
|---|---|---|
| `GET` | `/api/v1/requests/{id}/messages` | Liste paginée. Le Client ne voit jamais `is_internal = true`. |
| `POST` | `/api/v1/requests/{id}/messages` | Crée un message. Champs : `body` (Markdown limité), `is_internal` (réservé Gestionnaire/Responsable), `attachment_ids[]`. |
| `POST` | `/api/v1/requests/{id}/messages/{message_id}/withdraw` | Retire un message (auteur ou Admin). |

### 9.5.2 Pièces jointes

| Méthode | Chemin | Description |
|---|---|---|
| `POST` | `/api/v1/attachments/upload-url` | Génère une URL pré-signée S3 pour upload direct. Retourne aussi un `attachment_id` à référencer dans la demande/le message. |
| `POST` | `/api/v1/attachments/{id}/confirm` | Confirme la fin de l'upload côté client (déclenche le scan antivirus). |
| `GET` | `/api/v1/attachments/{id}` | Métadonnées de la pièce jointe (incluant le statut antivirus). |
| `GET` | `/api/v1/attachments/{id}/download-url` | Génère une URL pré-signée S3 de téléchargement (validité 5 min). |

### 9.5.3 Historique d'état

| Méthode | Chemin | Description |
|---|---|---|
| `GET` | `/api/v1/requests/{id}/state-history` | Historique chronologique des transitions. Lecture seule. |

### 9.5.4 Évaluation

| Méthode | Chemin | Description |
|---|---|---|
| `POST` | `/api/v1/requests/{id}/evaluation` | Soumet l'évaluation. Une seule par demande ; tentative ultérieure retourne 409. |
| `GET` | `/api/v1/requests/{id}/evaluation` | Lecture (Client auteur, Gestionnaire, Admin, DG). |

## 9.6 Catalogues, utilisateurs et configuration

### 9.6.1 Utilisateurs et organisations

| Méthode | Chemin | Rôles | Description |
|---|---|---|---|
| `GET` | `/api/v1/users/me` | tous | Profil de l'utilisateur courant. |
| `PATCH` | `/api/v1/users/me` | tous | Met à jour le profil propre. |
| `POST` | `/api/v1/users/me/password` | tous | Change son mot de passe (vérifie l'ancien). |
| `GET` | `/api/v1/users` | Admin, Gestionnaire | Liste filtrable. |
| `POST` | `/api/v1/users` | Admin | Crée un compte. |
| `GET` | `/api/v1/users/{id}` | Admin | Détail. |
| `PATCH` | `/api/v1/users/{id}` | Admin | Met à jour. |
| `POST` | `/api/v1/users/{id}/deactivate` | Admin | Désactive un compte. |
| `POST` | `/api/v1/users/{id}/reactivate` | Admin | Réactive. |
| `POST` | `/api/v1/users/{id}/password-reset` | Admin | Force l'envoi d'un courriel de réinitialisation. |
| `GET, POST, PATCH` | `/api/v1/organizations…` | Admin | Gestion équivalente. |

### 9.6.2 Catégories et produits

| Méthode | Chemin | Rôles |
|---|---|---|
| `GET` | `/api/v1/categories` | tous (filtré par accès) |
| `POST/PATCH` | `/api/v1/categories…` | Admin |
| `GET` | `/api/v1/products` | tous |
| `POST/PATCH` | `/api/v1/products…` | Admin |

### 9.6.3 Niveaux de priorité et SLA

| Méthode | Chemin | Rôles |
|---|---|---|
| `GET` | `/api/v1/priority-levels` | tous |
| `PATCH` | `/api/v1/priority-levels/{id}` | Admin (sur validation DG, journalisé) |

### 9.6.4 Configuration

| Méthode | Chemin | Rôles |
|---|---|---|
| `GET, PATCH` | `/api/v1/settings/*` | Admin |

## 9.7 Tableaux de bord et indicateurs

| Méthode | Chemin | Description |
|---|---|---|
| `GET` | `/api/v1/dashboards/operational` | Indicateurs Gestionnaire/Responsable. Filtres : `assigned_to`, `period`. |
| `GET` | `/api/v1/dashboards/strategic` | Indicateurs DG. Paramètres `period_start`, `period_end`. |
| `GET` | `/api/v1/dashboards/strategic/export` | Export CSV avec les mêmes filtres. Retourne `Content-Type: text/csv` ; pour les exports volumineux (> 1000 lignes), retourne 202 + URL téléchargeable plus tard. |
| `GET` | `/api/v1/dashboards/product-quality` | Rapport bugs par produit. |

## 9.8 Journal d'audit

| Méthode | Chemin | Rôles |
|---|---|---|
| `GET` | `/api/v1/audit-log` | Admin uniquement. Filtres : `actor_user_id`, `action_code`, `object_type`, `object_id`, `occurred_after`, `occurred_before`. |
| `GET` | `/api/v1/users/me/audit-log` | tous | Restreint aux actions de l'utilisateur lui-même. |

## 9.9 WebSocket temps réel

- **[EXG-09-070] (MUST)** Un endpoint `WSS /ws/notifications` accepte les connexions authentifiées (JWT en `query` ou via sous-protocole) et diffuse les événements ciblant l'utilisateur.
- **[EXG-09-071] (MUST)** Format des messages WebSocket :

```json
{
  "type": "notification",
  "event": "DEMANDE_AFFECTEE",
  "request_id": "uuid",
  "public_reference": "MTF-20260526-0042",
  "payload": { ... },
  "occurred_at": "2026-05-26T08:35:00Z"
}
```

- **[EXG-09-072] (MUST)** Le serveur envoie un `ping` toutes les 30 secondes ; le client répond par `pong`. Une absence de réponse pendant 60s ferme la connexion.
- **[EXG-09-073] (MUST)** Le client reçoit aussi les événements de mise à jour de demandes auxquelles il a accès (file d'attente du Gestionnaire, etc.), pas seulement des notifications strictes.

## 9.10 Limitation de débit (rate limiting)

- **[EXG-09-080] (MUST)** Une limitation par IP **et** par utilisateur est en place. Valeurs par défaut au MVP (à ajuster) :
  - 60 requêtes / minute par IP, glissant.
  - 600 requêtes / 10 minutes par utilisateur authentifié.
  - 5 tentatives de login / 15 minutes par IP + email combinés.
- **[EXG-09-081] (MUST)** Réponse 429 avec en-tête `Retry-After: <seconds>` lors du dépassement.
- **[EXG-09-082] (MUST)** Limites configurables par l'Administrateur.

## 9.11 Observabilité de l'API

- **[EXG-09-090] (MUST)** Toute requête porte un identifiant de corrélation (`X-Request-Id`) émis par le serveur si absent côté client, propagé dans les logs et le journal d'audit.
- **[EXG-09-091] (MUST)** Logs structurés JSON : `timestamp, level, service, request_id, user_id, route, status_code, latency_ms, error_code`.
- **[EXG-09-092] (MUST)** Endpoint `/api/v1/health` (public) et `/api/v1/health/ready` (auth requise) pour les sondes infrastructure.

## 9.12 Documentation interactive

- **[EXG-09-100] (MUST)** Une spécification **OpenAPI 3.1** est maintenue dans le dépôt et publiée à `/api/v1/docs` (Swagger UI) en environnement de dev et de recette.
- **[EXG-09-101] (MUST)** La spécification est source de vérité (génération de stubs et de la documentation) ; elle est versionnée avec le code.
