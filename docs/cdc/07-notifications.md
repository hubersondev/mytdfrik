# 07 — Notifications

## 7.1 Principes directeurs

- **[EXG-07-001] (MUST)** Toute action significative sur une demande déclenche une notification ciblée. Le silence est l'exception, pas la règle.
- **[EXG-07-002] (MUST)** Une notification est toujours adressée à un ou plusieurs destinataires identifiés. Aucun broadcast non ciblé.
- **[EXG-07-003] (MUST)** L'utilisateur peut configurer ses préférences (canaux activés, fréquence) sans pouvoir totalement supprimer les notifications dites « critiques » (voir §7.6).
- **[EXG-07-004] (MUST)** L'envoi de notifications doit être asynchrone et non bloquant pour l'API métier. Une défaillance du service de notifications ne doit jamais empêcher une transition d'état.

## 7.2 Canaux de notification

| Canal | Disponible | Description | Usage |
|---|---|---|---|
| `IN_APP` | MVP | Notification affichée dans l'interface MyTDFRIK (cloche, badge, page dédiée). | Information de présence de mise à jour. |
| `WEB_PUSH_REALTIME` | MVP | Push en temps réel via WebSocket vers le client web connecté. | Mise à jour live des vues ouvertes (file d'attente, fiche de demande). |
| `EMAIL` | MVP | Courriel transactionnel envoyé via le service tiers retenu (SendGrid ou Mailgun). | Notification asynchrone et persistante. |
| `SMS` | V2 | SMS via passerelle (Twilio, ou opérateur local). | Évènements critiques (P0) — V2. |
| `WHATSAPP` | V2 | Message WhatsApp Business API. | Communication enrichie avec les Clients — V2. |

- **[EXG-07-010] (MUST)** Le MVP active simultanément `IN_APP`, `WEB_PUSH_REALTIME` et `EMAIL`. Les autres canaux sont reportés à la V2 mais le modèle de données doit déjà les anticiper (chapitre 08).

## 7.3 Matrice événements × destinataires × canaux

La matrice ci-dessous croise les événements émis (chapitre 04 §4.8), leurs destinataires types et les canaux activés au MVP. Légende : ✉️ Email, 🔔 In-app, ⚡ WebSocket temps réel. Une cellule vide signifie « pas de notification ».

| Événement | Client (auteur) | Client (org) | Gestionnaire | Responsable affecté | Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| `DEMANDE_CREEE` | ✉️🔔 | 🔔 | 🔔⚡ | — | — |
| `DEMANDE_QUALIFIEE` | ✉️🔔 | 🔔 | — | — | — |
| `COMPLEMENT_DEMANDE` | ✉️🔔 | 🔔 | — | — | — |
| `DEMANDE_ANNULEE` | ✉️🔔 | 🔔 | 🔔⚡ | — | — |
| `DEMANDE_REJETEE` | ✉️🔔 | 🔔 | — | — | — |
| `DEMANDE_AFFECTEE` | ✉️🔔 | 🔔 | — | ✉️🔔⚡ | — |
| `TRAITEMENT_DEMARRE` | ✉️🔔 | 🔔 | — | — | — |
| `AFFECTATION_REFUSEE` | — | — | ✉️🔔⚡ | — | — |
| `REAFFECTATION_DEMANDEE` | — | — | ✉️🔔⚡ | — | — |
| `CLIENT_A_REPONDU` | — | — | 🔔⚡ (si en attente du Gestionnaire) | ✉️🔔⚡ (si en attente du Responsable) | — |
| `NOUVEAU_MESSAGE_INTERNE` | — | — | 🔔⚡ | 🔔⚡ | — |
| `NOUVEAU_MESSAGE_CLIENT` (Resp/Gest → Client) | ✉️🔔 | 🔔 | — | — | — |
| `RESOLUTION_PROPOSEE` | ✉️🔔 | 🔔 | — | — | — |
| `RESOLUTION_REFUSEE` | — | — | 🔔⚡ | ✉️🔔⚡ | — |
| `DEMANDE_CLOTUREE` | ✉️🔔 | 🔔 | — | — | — |
| `DEMANDE_CLOTUREE_AUTO` | ✉️🔔 | 🔔 | — | — | — |
| `DEMANDE_REOUVERTE` | — | — | ✉️🔔⚡ | ✉️🔔⚡ (si encore actif) | — |
| `EVALUATION_BASSE` (note ≤ 2) | — | — | ✉️🔔 | — | 🔔 |
| `COMPTE_VERROUILLE` (5 échecs auth) | ✉️ (titulaire) | — | — | — | ✉️🔔 |
| `MOT_DE_PASSE_REINITIALISE` | ✉️ (titulaire) | — | — | — | — |

Notes :

- « Client (auteur) » désigne le Client ayant créé la demande. « Client (org) » désigne les autres comptes Client de la même organisation, qui reçoivent l'info en in-app uniquement (pas par courriel, pour éviter le bruit).
- Les notifications in-app peuvent être marquées lues. Les courriels n'ont pas d'accusé de lecture.
- Les notifications « temps réel » (⚡) ne sont émises que si l'utilisateur a une session WebSocket ouverte ; sinon elles sont remplacées par la version in-app à la prochaine connexion.

## 7.4 Format des courriels transactionnels

### 7.4.1 Règles communes

- **[EXG-07-020] (MUST)** Chaque courriel transactionnel est généré à partir d'un **modèle paramétrable** par l'Administrateur (gabarits dans la base, voir chapitre 08), avec variables typées.
- **[EXG-07-021] (MUST)** Tout courriel contient :
  - En-tête identifiant clairement TECHDIFRIK (logo, nom de produit MyTDFRIK).
  - Le numéro de la demande (`MTF-AAAAMMJJ-NNNN`) dans l'objet et le corps.
  - Un lien direct vers la fiche de la demande dans MyTDFRIK (lien de connexion classique, pas de magic link sans authentification).
  - Le résumé de l'action effectuée et de l'acteur.
  - Un pied de page avec : politique RGPD résumée, lien de gestion des préférences de notifications, mention « ne pas répondre — cet envoi est automatique ».
- **[EXG-07-022] (MUST)** Les courriels sont fournis en HTML **et** en texte brut (multipart) pour les clients ne lisant pas le HTML.
- **[EXG-07-023] (MUST)** L'adresse expéditrice est unique et identifiée (`notifications@techdifrik.com` [À VALIDER]) ; les enregistrements **SPF**, **DKIM** et **DMARC** sont configurés sur le domaine.
- **[EXG-07-024] (MUST)** Les modèles sont versionnés ; toute modification est tracée dans le journal d'audit.

### 7.4.2 Sujets normalisés

- **[EXG-07-030] (MUST)** Le sujet suit un format normalisé permettant le filtrage côté client courriel : `[MyTDFRIK] [MTF-AAAAMMJJ-NNNN] <action> — <résumé court>`.

Exemples :

- `[MyTDFRIK] [MTF-20260520-0042] Votre demande a été affectée — Bug sur le portail TDFK Online`
- `[MyTDFRIK] [MTF-20260520-0042] Résolution proposée, votre validation est attendue`

### 7.4.3 Anti-bruit et regroupement

- **[EXG-07-040] (SHOULD)** Si plusieurs événements concernent la même demande dans un délai court (par défaut **5 minutes**, paramétrable), les courriels sont regroupés en un seul digest avec la liste des événements.
- **[EXG-07-041] (SHOULD)** Le `Reply-To` est désactivé ou redirigé vers un robot informatif renvoyant un courriel explicatif « pour répondre, utilisez la messagerie intégrée à MyTDFRIK ».
- **[EXG-07-042] (COULD)** Une option « digest quotidien » est proposée aux utilisateurs très exposés (Gestionnaire, Administrateur). Quand activée, seules les notifications critiques sont envoyées en temps réel ; les autres sont consolidées en un courriel quotidien.

### 7.4.4 Gestion des bounces

- **[EXG-07-050] (MUST)** Le service de courriel tiers signale les bounces (hard et soft). Le système maintient un compteur par adresse :
  - 1 hard bounce ⇒ adresse marquée `INVALID`, plus aucun envoi tant qu'elle n'est pas vérifiée à nouveau (réinitialisation par l'Administrateur ou par l'utilisateur après modification du courriel).
  - 5 soft bounces consécutifs en 24h ⇒ traités comme un hard bounce.
- **[EXG-07-051] (MUST)** Un courriel marqué `INVALID` désactive uniquement le canal `EMAIL` ; les notifications in-app continuent.

## 7.5 Notifications in-app

- **[EXG-07-060] (MUST)** Chaque utilisateur dispose d'une page dédiée listant ses notifications, avec filtres (lues/non lues, type, demande).
- **[EXG-07-061] (MUST)** Un badge global (compteur de non lues) est visible depuis toutes les pages.
- **[EXG-07-062] (MUST)** Le clic sur une notification mène à la demande concernée et marque la notification comme lue automatiquement.
- **[EXG-07-063] (MUST)** L'utilisateur peut « tout marquer comme lu » d'un clic.
- **[EXG-07-064] (MUST)** Les notifications in-app sont conservées **90 jours** puis purgées automatiquement. Les actions correspondantes restent traçables via le journal d'audit.

## 7.6 Préférences utilisateur

### 7.6.1 Canaux activables

- **[EXG-07-070] (MUST)** L'utilisateur peut choisir, par catégorie d'événement, quels canaux il souhaite voir activés (parmi ceux disponibles à son rôle).
- **[EXG-07-071] (MUST)** Catégories d'événements (regroupement utilisateur) :
  - `Activité sur mes demandes` (Client uniquement).
  - `Affectations et mises à jour` (Responsable).
  - `File d'attente et gestion` (Gestionnaire).
  - `Sécurité du compte` (tous rôles — non désactivable).
  - `Administration` (Admin).

### 7.6.2 Notifications critiques non désactivables

- **[EXG-07-080] (MUST)** Les notifications suivantes sont toujours envoyées (au minimum par courriel), même si l'utilisateur a tout désactivé :
  - `COMPTE_VERROUILLE`
  - `MOT_DE_PASSE_REINITIALISE`
  - `EVENEMENT_RGPD` (consentement, droit d'effacement engagé, export de données généré)
  - `DEMANDE_CLOTUREE_AUTO` (clôture sans validation explicite, pour donner au Client une dernière chance de réagir)

### 7.6.3 Mode silence

- **[EXG-07-090] (COULD)** Un mode « ne pas déranger » paramétrable par plage horaire est offert : les notifications non critiques sont mises en file et délivrées à la fin du créneau.

## 7.7 Architecture du sous-système de notifications

- **[EXG-07-100] (MUST)** Le service de notifications est implémenté comme un consommateur d'événements métier :
  - Les transitions du chapitre 04 émettent des **événements de domaine** dans un broker interne (Redis Streams au minimum, RabbitMQ ou équivalent au mieux).
  - Le service de notifications consomme ces événements, calcule les destinataires effectifs, applique les préférences utilisateur, et router vers les canaux activés.
- **[EXG-07-101] (MUST)** Chaque tentative d'envoi est tracée : `notification_id`, `event_id`, `recipient_id`, `channel`, `status` (`PENDING`, `SENT`, `FAILED`, `BOUNCED`), `attempts`, horodatages.
- **[EXG-07-102] (MUST)** En cas d'échec, retry exponentiel borné (3 tentatives, intervalles 1 min / 10 min / 1 h). Au-delà, statut `FAILED` et alerte technique.
- **[EXG-07-103] (MUST)** Le WebSocket temps réel est servi par une connexion authentifiée (jeton JWT) ; le serveur diffuse vers les `recipient_id` actifs.

## 7.8 Récapitulatif des modèles de courriels (annexe A4)

Les gabarits complets sont en annexe A4. Liste des gabarits MVP requis :

| Code gabarit | Événement déclencheur | Destinataire |
|---|---|---|
| `ACCUSE_RECEPTION` | `DEMANDE_CREEE` | Client auteur |
| `DEMANDE_QUALIFIEE` | `DEMANDE_QUALIFIEE` | Client auteur |
| `COMPLEMENT_DEMANDE` | `COMPLEMENT_DEMANDE` | Client auteur |
| `DEMANDE_REJETEE` | `DEMANDE_REJETEE` | Client auteur |
| `DEMANDE_AFFECTEE_CLIENT` | `DEMANDE_AFFECTEE` | Client auteur |
| `DEMANDE_AFFECTEE_RESPONSABLE` | `DEMANDE_AFFECTEE` | Responsable |
| `TRAITEMENT_DEMARRE` | `TRAITEMENT_DEMARRE` | Client auteur |
| `NOUVEAU_MESSAGE` | `NOUVEAU_MESSAGE_CLIENT` ou interne | Variable |
| `RESOLUTION_PROPOSEE` | `RESOLUTION_PROPOSEE` | Client auteur |
| `DEMANDE_CLOTUREE` | `DEMANDE_CLOTUREE` | Client auteur (+ invite évaluation) |
| `DEMANDE_CLOTUREE_AUTO` | `DEMANDE_CLOTUREE_AUTO` | Client auteur |
| `DEMANDE_REOUVERTE` | `DEMANDE_REOUVERTE` | Gestionnaire, Responsable |
| `EVALUATION_BASSE` | note ≤ 2 | Gestionnaire (+ Admin info) |
| `COMPTE_CREE_ACTIVATION` | Création de compte | Titulaire |
| `MOT_DE_PASSE_REINITIALISATION_LIEN` | Demande de réinit | Titulaire |
| `MOT_DE_PASSE_REINITIALISE_CONFIRMATION` | Réinit effectuée | Titulaire |
| `COMPTE_VERROUILLE` | 5 échecs auth | Titulaire (+ Admin info) |
