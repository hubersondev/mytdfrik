# 03 — Périmètre fonctionnel

Ce chapitre énumère les modules fonctionnels du MVP, leurs principales exigences et les renvois vers les chapitres spécialisés. Le détail des règles métier complexes (cycle de vie, priorisation, bugs, notifications) est traité dans les chapitres dédiés.

## 3.1 Cartographie des modules

| Code | Module | Renvoi |
|---|---|---|
| M01 | Authentification et gestion de session | §3.2 + chapitre 10 |
| M02 | Gestion des comptes et profils | §3.3 |
| M03 | Création et soumission d'une demande | §3.4 |
| M04 | Catégorisation et catalogue | §3.5 + annexe A3 |
| M05 | Qualification et affectation | §3.6 + chapitre 04 |
| M06 | Priorisation Impact × Urgence | Chapitre 05 |
| M07 | Traitement et messagerie | §3.7 + chapitre 04 |
| M08 | Pièces jointes | §3.8 |
| M09 | Signalement de bugs | Chapitre 06 |
| M10 | Notifications | Chapitre 07 |
| M11 | Clôture et évaluation | §3.9 |
| M12 | Réouverture | §3.10 + chapitre 04 |
| M13 | Tableaux de bord et indicateurs | §3.11 |
| M14 | Administration et configuration | §3.12 |
| M15 | Journal d'audit | §3.13 + chapitre 10 |

## 3.2 M01 — Authentification et gestion de session

- **[EXG-03-001] (MUST)** Authentification par couple identifiant (courriel) + mot de passe.
- **[EXG-03-002] (MUST)** Réinitialisation autonome du mot de passe via lien à usage unique envoyé par courriel (validité : 30 minutes).
- **[EXG-03-003] (MUST)** Verrouillage temporaire du compte après 5 échecs consécutifs (délai : 15 minutes). Le verrouillage est levé automatiquement ou manuellement par l'Administrateur.
- **[EXG-03-004] (MUST)** Déconnexion volontaire et déconnexion automatique après période d'inactivité (durée : 30 minutes, paramétrable par l'Administrateur).
- **[EXG-03-005] (MUST)** Gestion d'une session unique par utilisateur n'est **pas** imposée : un utilisateur peut être connecté simultanément depuis plusieurs appareils.
- **[EXG-03-006] (SHOULD)** Affichage d'un historique des dernières connexions (date, heure, adresse IP, agent utilisateur) consultable par l'utilisateur lui-même.
- **[EXG-03-007] (COULD)** Possibilité de révoquer toutes les sessions actives depuis le profil utilisateur.
- **[EXG-03-008] (WONT au MVP)** MFA (authentification à deux facteurs) — reporté en V2.
- **[EXG-03-009] (WONT au MVP)** SSO/OAuth tiers (Google, Microsoft, etc.) — reporté en V2.

Le détail technique (algorithme de hash, durée de vie des jetons, etc.) est dans le chapitre 10.

## 3.3 M02 — Gestion des comptes et profils

- **[EXG-03-010] (MUST)** L'Administrateur crée un compte en saisissant : nom, prénom, courriel, rôle, organisation (pour les Clients uniquement). Un courriel d'activation est envoyé avec un lien permettant la définition du premier mot de passe.
- **[EXG-03-011] (MUST)** L'utilisateur peut modifier son profil : nom, prénom, courriel, téléphone, photo (optionnelle), préférences de notification (voir chapitre 07).
- **[EXG-03-012] (MUST)** Le changement de courriel est confirmé par double validation : courriel envoyé sur l'ancienne adresse et lien de confirmation sur la nouvelle.
- **[EXG-03-013] (MUST)** L'Administrateur peut désactiver un compte. Un compte désactivé conserve son historique mais ne peut plus se connecter et n'est plus affecté à de nouvelles demandes.
- **[EXG-03-014] (MUST)** La suppression définitive d'un compte n'est pas exposée dans l'interface au MVP — elle relève du processus RGPD documenté au chapitre 10 (droit à l'effacement).
- **[EXG-03-015] (MUST)** Chaque organisation cliente est représentée par une entité distincte. Plusieurs comptes Client peuvent être rattachés à la même organisation.

## 3.4 M03 — Création et soumission d'une demande

- **[EXG-03-020] (MUST)** Le Client crée une demande en suivant un processus en étapes :
  1. Sélection de la catégorie (parmi le catalogue géré par l'Administrateur).
  2. Renseignement du formulaire adaptatif (champs propres à la catégorie).
  3. Renseignement des éléments de priorisation (impact métier, urgence métier, contexte libre — voir chapitre 05).
  4. Ajout de pièces jointes (optionnel).
  5. Revue et soumission.
- **[EXG-03-021] (MUST)** Un brouillon est sauvegardé automatiquement à chaque changement d'étape, permettant la reprise ultérieure (durée de conservation des brouillons : 30 jours).
- **[EXG-03-022] (MUST)** Toute demande soumise reçoit un identifiant unique de la forme `MTF-AAAAMMJJ-NNNN` (`MTF` pour MyTDFRIK, date du jour, compteur séquentiel sur la journée), affiché immédiatement au Client et utilisable comme référence.
- **[EXG-03-023] (MUST)** Les champs obligatoires sont validés côté client **et** côté serveur. La validation côté client est de l'ergonomie ; la validation côté serveur est la règle de référence.
- **[EXG-03-024] (MUST)** Une demande ne peut pas être supprimée par le Client après soumission. Elle peut être annulée tant qu'elle est en statut `Nouvelle` (transition `Nouvelle → Annulée par le client`, voir chapitre 04).

## 3.5 M04 — Catégorisation et catalogue

- **[EXG-03-030] (MUST)** Le catalogue initial des catégories est défini en annexe A3 ; il est éditable par l'Administrateur sans déploiement.
- **[EXG-03-031] (MUST)** Chaque catégorie porte les attributs suivants : libellé, description, priorité par défaut (P0 à P4), formulaire adaptatif associé, équipe de Responsables habituelle (indicatif, non bloquant), actif/inactif.
- **[EXG-03-032] (MUST)** Désactiver une catégorie n'affecte pas les demandes existantes ; cette catégorie n'est simplement plus proposée à la création de nouvelles demandes.
- **[EXG-03-033] (SHOULD)** Une catégorie peut être marquée comme « réservée » (visible uniquement par certains Clients ou organisations) — utile pour les services premium.

## 3.6 M05 — Qualification et affectation

Voir aussi chapitre 04 (cycle de vie) pour les transitions d'état.

- **[EXG-03-040] (MUST)** Un Gestionnaire peut qualifier une demande en statut `Nouvelle` :
  - Reclasser la catégorie si erronée.
  - Valider ou ajuster la priorité système (voir chapitre 05).
  - Demander des compléments au Client (`En attente client`).
  - Marquer la demande comme doublon d'une autre (fusion, SHOULD au MVP).
  - Affecter la demande à un Responsable (`Affectée`).
- **[EXG-03-041] (MUST)** Tout ajustement de priorité par le Gestionnaire impose la saisie d'un motif court (texte libre) qui sera consultable par le Client.
- **[EXG-03-042] (MUST)** L'affectation à un Responsable est nominative. Les files d'attente d'équipe (affectation à une équipe plutôt qu'à un Responsable nominal) sont WONT au MVP.
- **[EXG-03-043] (MUST)** Un Responsable peut refuser une demande affectée en justifiant ; la demande retourne en `Nouvelle` avec mention du motif, pour réaffectation par le Gestionnaire.

## 3.7 M07 — Traitement et messagerie

- **[EXG-03-050] (MUST)** Le Responsable peut faire avancer le statut d'une demande affectée selon la machine à états du chapitre 04.
- **[EXG-03-051] (MUST)** Une messagerie est disponible sur chaque demande, partagée entre le Client, le Responsable et le Gestionnaire.
- **[EXG-03-052] (MUST)** Les messages sont horodatés (heure serveur) et signés (auteur, rôle).
- **[EXG-03-053] (MUST)** Un message envoyé déclenche une notification (voir chapitre 07).
- **[EXG-03-054] (MUST)** Les messages internes (échangés entre Gestionnaire et Responsable, non visibles du Client) existent dès le MVP et sont marqués distinctement.
- **[EXG-03-055] (SHOULD)** La messagerie supporte un format texte enrichi simple (gras, italique, listes, liens, blocs de code), sans HTML arbitraire.
- **[EXG-03-056] (MUST)** Les messages ne sont pas éditables après envoi. Ils peuvent être marqués `Retiré par l'auteur` (texte remplacé par une mention), mais l'original reste consultable dans le journal d'audit pour les Administrateurs.

## 3.8 M08 — Pièces jointes

- **[EXG-03-060] (MUST)** Une demande peut porter plusieurs pièces jointes, ajoutées à la création ou ultérieurement via la messagerie.
- **[EXG-03-061] (MUST)** Formats autorisés au MVP : `pdf, png, jpg, jpeg, gif, txt, log, csv, doc, docx, xls, xlsx, ppt, pptx, zip, mp4 (limite à confirmer)`. Tout autre format est refusé.
- **[EXG-03-062] (MUST)** Taille unitaire maximale : **25 Mo par fichier**. Taille cumulée maximale par demande : **100 Mo**.
- **[EXG-03-063] (MUST)** Chaque pièce jointe est analysée par un antivirus avant d'être rendue disponible au téléchargement. Une pièce jointe en cours d'analyse apparaît avec un statut `En vérification` ; en cas de détection, elle est rejetée et l'auteur est notifié.
- **[EXG-03-064] (MUST)** Les pièces jointes sont stockées dans un service compatible S3 (voir chapitre 11). Les URL de téléchargement sont signées et expirent (durée : 5 minutes par défaut).
- **[EXG-03-065] (MUST)** Une pièce jointe ne peut pas être supprimée par son auteur après envoi. Elle peut être marquée `Retirée` (téléchargement bloqué pour les autres rôles que l'Administrateur) avec saisie d'un motif.

## 3.9 M11 — Clôture et évaluation

- **[EXG-03-070] (MUST)** Le Responsable propose la clôture via une transition `Résolue`. Le Client est notifié.
- **[EXG-03-071] (MUST)** Le Client dispose d'un délai de **7 jours calendaires** pour confirmer ou refuser la résolution.
  - S'il confirme, la demande passe en `Clôturée` et l'évaluation de satisfaction est demandée.
  - S'il refuse, la demande revient en `En cours de traitement` avec son commentaire de refus.
  - S'il ne répond pas dans le délai, la demande passe automatiquement en `Clôturée (sans validation explicite)` et l'évaluation reste optionnelle.
- **[EXG-03-072] (MUST)** L'évaluation porte sur une note 1 à 5 et un commentaire libre (optionnel).
- **[EXG-03-073] (MUST)** Les évaluations alimentent les indicateurs DG (voir §3.11).
- **[EXG-03-074] (SHOULD)** Une évaluation de 1 ou 2 déclenche une notification automatique au Gestionnaire pour suivi qualité.

## 3.10 M12 — Réouverture

- **[EXG-03-080] (MUST)** Le Client peut réouvrir une demande clôturée dans un délai de **30 jours calendaires** suivant la clôture, en justifiant la réouverture.
- **[EXG-03-081] (MUST)** Une réouverture déclenche un nouveau cycle de traitement avec priorité automatiquement réhaussée d'un niveau (par exemple P3 → P2), plafonnée à P1.
- **[EXG-03-082] (MUST)** Une demande peut être réouverte au maximum **2 fois**. Au-delà, elle doit être recréée comme une nouvelle demande, en référençant l'historique.
- **[EXG-03-083] (MUST)** Toute réouverture est tracée dans le journal d'audit avec son motif.

## 3.11 M13 — Tableaux de bord et indicateurs

### 3.11.1 Tableau de bord opérationnel (Gestionnaire, Responsable, Administrateur)

- **[EXG-03-090] (MUST)** File d'attente personnelle / globale avec tri et filtres.
- **[EXG-03-091] (MUST)** Compteurs en-tête : demandes en cours, en attente client, en retard SLA, à clôturer.
- **[EXG-03-092] (MUST)** Vue charge par Responsable (visible Gestionnaire et Administrateur).

### 3.11.2 Tableau de bord stratégique (DG, Administrateur)

- **[EXG-03-100] (MUST)** Indicateurs sur période sélectionnable (mois en cours, 30 jours, 90 jours, année, plage personnalisée) :
  - Volume de demandes reçues, traitées, clôturées.
  - Délai moyen de prise en charge (soumission → première action qualifiée).
  - Délai moyen de résolution (soumission → clôture).
  - Taux de satisfaction moyen (note 1-5).
  - Taux de réouverture des tickets clôturés.
  - Distribution par catégorie (top 10).
  - Distribution par priorité (P0 à P4).
  - Charge par Responsable (nombre de tickets en cours, traités, ratio respect SLA).
  - Pour les bugs : nombre de signalements par produit, taux de résolution, délai moyen de correction.
- **[EXG-03-101] (MUST)** Tous les indicateurs sont exportables en CSV.
- **[EXG-03-102] (SHOULD)** Visualisations graphiques (séries temporelles, camemberts) en complément des tableaux chiffrés.

## 3.12 M14 — Administration et configuration

- **[EXG-03-110] (MUST)** Interface d'administration distincte des espaces opérationnels, accessible uniquement par le rôle `ADMIN`.
- **[EXG-03-111] (MUST)** Fonctionnalités d'administration :
  - Gestion des comptes utilisateurs (CRUD, activation, désactivation).
  - Gestion des catégories de demandes et de leurs paramètres.
  - Gestion du catalogue de produits/services référencés par les bugs.
  - Paramétrage des SLA cibles par priorité.
  - Gestion des modèles de courriels.
  - Consultation du journal d'audit.
  - Paramétrage des durées (verrouillage, inactivité de session, délais de validation de clôture, durée de conservation des brouillons).

## 3.13 M15 — Journal d'audit

- **[EXG-03-120] (MUST)** Toutes les actions modifiant l'état d'une demande, d'un compte ou de la configuration sont consignées dans un journal d'audit immuable.
- **[EXG-03-121] (MUST)** Chaque entrée contient au minimum : horodatage UTC, identifiant et rôle de l'acteur, type d'action, identifiant de l'objet impacté, valeurs avant/après (si applicable), adresse IP source, agent utilisateur.
- **[EXG-03-122] (MUST)** Les entrées du journal d'audit ne sont jamais modifiables ni supprimables. La durée de conservation est de **5 ans** minimum (voir chapitre 10 pour la justification RGPD).
- **[EXG-03-123] (MUST)** L'Administrateur peut rechercher dans le journal par acteur, type d'action, objet, période.

## 3.14 Récapitulatif des règles métier globales

| Code | Règle | Application |
|---|---|---|
| RM1 | Une demande appartient à une seule organisation cliente. | Création |
| RM2 | Une demande est créée uniquement par un Client. | Création |
| RM3 | La priorité système est calculée, jamais saisie librement par le Client. | Voir chapitre 05 |
| RM4 | Une demande affectée a toujours un Responsable nominal. | Affectation |
| RM5 | Une demande peut être réouverte 2 fois maximum, dans les 30 jours suivant la clôture. | Réouverture |
| RM6 | Toute modification de priorité ou d'affectation par le Gestionnaire est tracée avec un motif. | Audit |
| RM7 | Un message envoyé est non éditable ; seul un retrait avec horodatage est possible. | Messagerie |
| RM8 | Une pièce jointe ne devient téléchargeable qu'après analyse antivirus. | Stockage |
| RM9 | Un compte désactivé conserve son historique mais ne peut plus se connecter. | Compte |
| RM10 | Toutes les durées de vie (sessions, brouillons, validations de clôture) sont paramétrables par l'Administrateur. | Configuration |
