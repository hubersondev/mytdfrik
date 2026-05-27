# 10 — Sécurité et conformité RGPD

## 10.1 Cadre de référence

- **[EXG-10-001] (MUST)** La plateforme respecte les **bonnes pratiques OWASP Top 10** (2021) et leurs équivalents API (OWASP API Security Top 10).
- **[EXG-10-002] (MUST)** La plateforme est conforme au **Règlement général sur la protection des données (RGPD, UE 2016/679)**, considéré ici comme le standard de référence indépendamment du pays d'hébergement.
- **[EXG-10-003] (SHOULD)** L'architecture s'aligne sur les recommandations de l'**ANSSI** (Agence nationale de la sécurité des systèmes d'information) pour les applications web de classe 2 (données personnelles non sensibles).

## 10.2 Authentification

### 10.2.1 Mots de passe

- **[EXG-10-010] (MUST)** Algorithme de hash : **argon2id** (paramètres : `m=64 Mo, t=3, p=4` minimum) ou **bcrypt** (coût ≥ 12). Aucun stockage en clair, jamais de MD5/SHA1/SHA256 brut.
- **[EXG-10-011] (MUST)** Politique de complexité minimale appliquée à la création et au changement :
  - Longueur ≥ 12 caractères.
  - Au moins 3 des 4 classes : minuscules, majuscules, chiffres, caractères spéciaux.
  - Refus des mots de passe figurant dans la liste **HaveIBeenPwned** (vérification via API k-anonymity ou liste téléchargée localement).
- **[EXG-10-012] (MUST)** Aucune limitation de longueur maximale en dessous de 128 caractères.
- **[EXG-10-013] (MUST)** Réinitialisation par lien à usage unique, hash en base, expiration 30 minutes. La réinitialisation invalide toutes les sessions existantes.
- **[EXG-10-014] (MUST)** Pas de question secrète, pas d'indice. La récupération passe exclusivement par le canal courriel.
- **[EXG-10-015] (SHOULD)** Avertissement non bloquant si le mot de passe choisi est trop proche d'identifiants personnels (courriel, nom).
- **[EXG-10-016] (WONT au MVP)** Politique de **rotation forcée** des mots de passe — l'ANSSI ne la recommande plus dès lors que la détection de fuite est en place.

### 10.2.2 Verrouillage

- **[EXG-10-020] (MUST)** Verrouillage temporaire après **5 échecs consécutifs** dans une fenêtre de 15 minutes. Durée du verrouillage : 15 minutes, paramétrable.
- **[EXG-10-021] (MUST)** Le verrouillage et le déverrouillage sont journalisés ; le titulaire est notifié par courriel (notification critique, voir chapitre 07).
- **[EXG-10-022] (MUST)** L'Administrateur peut déverrouiller manuellement.

### 10.2.3 Sessions et jetons

- **[EXG-10-030] (MUST)** JWT court (15 minutes) + refresh token long (7 jours glissants, voir chapitre 9 §9.3.1).
- **[EXG-10-031] (MUST)** Refresh tokens stockés **hashés** (SHA-256) en base. Aucun jeton récupérable en clair après émission.
- **[EXG-10-032] (MUST)** Rotation du refresh token à chaque usage : l'utilisation d'un refresh token invalide le précédent. La détection d'une réémission par un refresh token déjà utilisé déclenche la **révocation immédiate** de toutes les sessions du même utilisateur (signal d'utilisation frauduleuse).
- **[EXG-10-033] (MUST)** Déconnexion (volontaire ou par expiration) supprime/invalide le refresh token côté serveur.
- **[EXG-10-034] (MUST)** Inactivité de 30 minutes (paramétrable) côté client invalide la session (déconnexion automatique).
- **[EXG-10-035] (SHOULD)** Les jetons portent un identifiant `jti` permettant la révocation ciblée.

### 10.2.4 MFA et SSO

- **[EXG-10-040] (WONT au MVP)** MFA TOTP — V2.
- **[EXG-10-041] (WONT au MVP)** SSO OAuth (Google/Microsoft) — V2. Anticiper dans le modèle d'utilisateur la possibilité d'avoir plusieurs `identity_providers` rattachés.

## 10.3 Autorisation (RBAC)

- **[EXG-10-050] (MUST)** Le contrôle d'autorisation est appliqué **côté serveur** sur chaque endpoint, en croisant le rôle de l'utilisateur, l'organisation rattachée (si Client) et l'objet ciblé.
- **[EXG-10-051] (MUST)** La logique d'autorisation est centralisée dans une couche dédiée (policy/guard/middleware) testable unitairement. Pas de contrôle ad hoc dispersé dans les contrôleurs.
- **[EXG-10-052] (MUST)** Aucune information sensible ne fuit via les codes de retour : les ressources auxquelles l'utilisateur n'a pas accès retournent **404** plutôt que **403** quand l'existence même de la ressource est confidentielle.

## 10.4 Chiffrement

### 10.4.1 En transit

- **[EXG-10-060] (MUST)** HTTPS obligatoire sur toutes les routes, **TLS 1.2 minimum**, **TLS 1.3 recommandé**. Les ciphers anciens (TLS 1.0/1.1, SSLv3, RC4) sont désactivés.
- **[EXG-10-061] (MUST)** En-tête `Strict-Transport-Security` avec `max-age=31536000; includeSubDomains; preload` après vérification.
- **[EXG-10-062] (MUST)** Certificats Let's Encrypt ou certificat commercial, renouvellement automatique surveillé.
- **[EXG-10-063] (MUST)** Le WebSocket utilise `wss://` exclusivement.

### 10.4.2 Au repos

- **[EXG-10-070] (MUST)** La base de données est chiffrée au repos (chiffrement disque ou TDE selon l'offre de l'hébergeur).
- **[EXG-10-071] (MUST)** Les pièces jointes stockées sur S3 sont chiffrées (SSE-S3 minimum, SSE-KMS recommandé).
- **[EXG-10-072] (MUST)** Les sauvegardes sont chiffrées avec une clé distincte de celle de la production, conservée en gestionnaire de secrets.
- **[EXG-10-073] (SHOULD)** Les champs métier strictement confidentiels (en cas d'extension future : numéros de carte, IBAN, etc.) seraient chiffrés au niveau colonne — non applicable au MVP, mais le pattern reste documenté.

## 10.5 Protection des en-têtes et entrées

### 10.5.1 En-têtes de sécurité

- **[EXG-10-080] (MUST)** Les en-têtes HTTP suivants sont positionnés sur toutes les réponses :
  - `Content-Security-Policy` strict (sources internes uniquement, pas d'eval).
  - `X-Content-Type-Options: nosniff`.
  - `X-Frame-Options: DENY` (ou `frame-ancestors 'none'` via CSP).
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy` minimisant les capacités non utilisées.
  - `Cache-Control: no-store` pour les réponses contenant des données nominatives.

### 10.5.2 Validation et assainissement

- **[EXG-10-090] (MUST)** Toutes les entrées utilisateur sont validées côté serveur (allow-list, pas deny-list).
- **[EXG-10-091] (MUST)** Les requêtes SQL utilisent exclusivement le **paramétrage** (prepared statements ou ORM). Pas de concaténation dynamique de SQL.
- **[EXG-10-092] (MUST)** Les sorties Markdown (messagerie) sont rendues via un sanitizer reconnu (DOMPurify côté client, ou serveur), avec une **allow-list** d'éléments restreinte (gras, italique, listes, liens, blocs de code).
- **[EXG-10-093] (MUST)** Les liens dans les messages doivent appliquer `rel="noopener noreferrer"` et `target="_blank"`.
- **[EXG-10-094] (MUST)** Tous les uploads de pièces jointes sont :
  - Validés sur leur **type MIME réel** (détection magique, pas uniquement extension).
  - Analysés par **ClamAV** (ou équivalent) avant d'être rendus accessibles.
  - Renommés avec un identifiant non devinable (UUID), pas avec le nom original.
  - Servis depuis un domaine ou sous-domaine distinct, sans cookie de session, pour éviter les attaques par fichier embarqué.

### 10.5.3 CSRF

- **[EXG-10-100] (MUST)** L'API étant entièrement consommée via JWT en en-tête `Authorization`, le risque CSRF est intrinsèquement réduit. Néanmoins, **les cookies de session ne sont pas utilisés** au MVP — décision explicite.
- **[EXG-10-101] (MUST)** Si un cookie est introduit ultérieurement (par exemple pour un canal d'authentification SSO), il sera `HttpOnly`, `Secure`, `SameSite=Strict` et accompagné d'un jeton anti-CSRF par requête mutante.

## 10.6 Journal d'audit

- **[EXG-10-110] (MUST)** Les actions suivantes sont **toujours** journalisées : authentification (succès/échec), création/modification/désactivation de compte, changement de rôle, création/modification de demande, transitions d'état, override de priorité, accès aux journaux d'audit, accès aux pièces jointes, modification de configuration, modification des SLA, modification des modèles de courriel.
- **[EXG-10-111] (MUST)** Les entrées du journal d'audit sont **immuables**. Toute opération sur la table `audit_log` autre que `INSERT` est refusée par les droits de la base (utilisateur applicatif sans `UPDATE/DELETE` sur cette table).
- **[EXG-10-112] (MUST)** Durée de conservation : **5 ans** glissants (rétention RGPD + justification administrative). Au-delà, les entrées sont archivées sur stockage froid puis purgées après 7 ans totaux.
- **[EXG-10-113] (MUST)** Le journal d'audit ne contient **jamais** de mot de passe, de jeton, ni de pièce jointe en clair. Il référence (par identifiant) sans copier.

## 10.7 Conformité RGPD

### 10.7.1 Données personnelles traitées

| Catégorie | Exemples | Base légale | Conservation |
|---|---|---|---|
| Données d'identification | nom, prénom, courriel professionnel, téléphone | exécution du contrat (Client), relation employeur (collaborateurs internes) | Durée du compte + 3 ans |
| Données de connexion | adresses IP, agents utilisateurs, dates | obligation légale (sécurité) + intérêt légitime (sécurité) | 12 mois |
| Données métier | contenu des demandes, messages, pièces jointes | exécution du contrat | 5 ans après clôture |
| Données de support | journaux d'audit | obligation légale + intérêt légitime | 5 ans |

> **[EXG-10-120] (MUST)** Le **registre des traitements** RGPD est produit en annexe du présent CDC et mis à jour par le DPO de TECHDIFRIK [À DÉSIGNER].

### 10.7.2 Droits des personnes

- **[EXG-10-130] (MUST)** Droit d'accès : un utilisateur peut télécharger l'ensemble de ses données personnelles depuis son profil (export JSON + ZIP des pièces jointes attachées à ses demandes).
- **[EXG-10-131] (MUST)** Droit de rectification : l'utilisateur modifie son profil ; toute modification est journalisée.
- **[EXG-10-132] (MUST)** Droit à l'effacement (droit à l'oubli) : sur demande explicite traitée par l'Administrateur, le compte est **anonymisé** :
  - Les champs nominatifs (`first_name`, `last_name`, `email`, `phone`) sont remplacés par des valeurs génériques (`Utilisateur supprimé n°X`, courriel `deleted-{uuid}@anonymized.invalid`).
  - L'`id` et les liens vers les demandes / messages restent intacts pour préserver l'intégrité de l'historique métier.
  - Les pièces jointes téléversées par l'utilisateur restent accessibles aux Responsables traitants tant que la demande est ouverte ; après clôture définitive et au-delà du délai légal, elles sont également anonymisées (métadonnées) ou effacées.
- **[EXG-10-133] (MUST)** Droit d'opposition : l'utilisateur peut s'opposer à certains traitements (notifications non critiques, profilage statistique). Les notifications critiques (chapitre 07 §7.6.2) restent envoyées car relevant de l'exécution du contrat ou d'obligations légales.
- **[EXG-10-134] (MUST)** Droit à la portabilité : l'export au §10.7.2 fournit les données dans un format structuré lisible (JSON conforme à un schéma documenté).

### 10.7.3 Sous-traitants

- **[EXG-10-140] (MUST)** Tout fournisseur tiers traitant des données personnelles (hébergeur, service de courriel, service S3, antivirus, gestion de logs) fait l'objet d'un **contrat de sous-traitance** RGPD (DPA) signé.
- **[EXG-10-141] (MUST)** Le registre des sous-traitants est tenu à jour par le DPO. La liste indicative au MVP : AWS/OVH/Scaleway (hébergeur — à arbitrer), SendGrid/Mailgun (courriel — à arbitrer), service S3 (à arbitrer), ClamAV (auto-hébergé), service d'observabilité [À ARBITRER].

### 10.7.4 Transferts hors UE

- **[EXG-10-150] (MUST)** Si l'hébergement retenu implique des transferts hors UE (par exemple AWS US), les **clauses contractuelles types** (CCT) sont signées et un **AIPD** (analyse d'impact) est réalisé.
- **[EXG-10-151] (SHOULD)** Privilégier un hébergeur dont les serveurs sont en UE ou en Côte d'Ivoire si la juridiction locale le permet (OVH, Scaleway, …).

## 10.8 Sauvegardes et plan de reprise

- **[EXG-10-160] (MUST)** Sauvegardes complètes **quotidiennes** de la base de données, chiffrées, stockées sur un emplacement distinct de la production.
- **[EXG-10-161] (MUST)** Sauvegardes incrémentielles toutes les **6 heures**.
- **[EXG-10-162] (MUST)** Rétention : 30 jours en stockage chaud, 12 mois en stockage froid.
- **[EXG-10-163] (MUST)** Restauration testée **trimestriellement** sur un environnement isolé. Le rapport de test est conservé.
- **[EXG-10-164] (MUST)** Pour les pièces jointes S3 : versionnement activé + réplication cross-region (si l'hébergeur le supporte) ou snapshot quotidien sinon.
- **[EXG-10-165] (MUST)** Plan de reprise documenté avec **RPO ≤ 6 heures** et **RTO ≤ 4 heures** pour le MVP. À durcir progressivement.

## 10.9 Gestion des secrets

- **[EXG-10-170] (MUST)** Aucun secret en clair dans le code ni dans les images de conteneurs. Tous les secrets (clés JWT, mots de passe DB, clés S3, clés API courriel) sont stockés dans un gestionnaire de secrets dédié (AWS Secrets Manager, HashiCorp Vault, ou solution intégrée à l'hébergeur retenu).
- **[EXG-10-171] (MUST)** Les secrets sont rotables. Une procédure de rotation est documentée pour chaque secret.
- **[EXG-10-172] (MUST)** Aucun secret ne transite par les logs.

## 10.10 Surveillance et réponse aux incidents

- **[EXG-10-180] (MUST)** Alerting sur :
  - Pic anormal d'échecs d'authentification (potentielle attaque brute force).
  - Pic anormal de requêtes 4xx/5xx.
  - Pic anormal d'envois de courriels (potentiel détournement).
  - Détection de pièces jointes infectées (anomalie ou attaque ciblée).
- **[EXG-10-181] (MUST)** Procédure d'incident documentée :
  1. Constat → consignation horodatée.
  2. Évaluation : type, impact, données potentiellement affectées.
  3. Confinement (mesures techniques : révocation de jetons, désactivation de compte, blocage IP, etc.).
  4. Notification : DPO, Direction Générale ; si breach RGPD avéré, autorité de contrôle dans les 72 heures et personnes concernées si risque élevé.
  5. Remédiation et post-mortem documenté.
- **[EXG-10-182] (MUST)** Le registre des incidents est conservé 5 ans.

## 10.11 Tests de sécurité

- **[EXG-10-190] (MUST)** Test d'intrusion (pentest) externe **avant la mise en production** du MVP, sur un environnement iso-prod.
- **[EXG-10-191] (SHOULD)** Audit annuel récurrent.
- **[EXG-10-192] (MUST)** Analyse de composition logicielle (SCA) intégrée à la chaîne CI : détection automatique des dépendances vulnérables (Renovate, Dependabot, Snyk, ou équivalent).
- **[EXG-10-193] (MUST)** Analyse statique (SAST) sur le code de production avant fusion.
- **[EXG-10-194] (SHOULD)** Tests automatisés OWASP (ZAP en mode passif) sur l'environnement de recette.
