# 02 — Acteurs, rôles et droits

## 2.1 Vue d'ensemble des cinq rôles

MyTDFRIK distingue cinq rôles fonctionnels distincts. Chaque utilisateur de la plateforme se voit attribuer un et un seul rôle principal ; le cumul de rôles n'est pas autorisé au MVP afin de préserver la clarté des responsabilités et la lisibilité du journal d'audit.

| Code rôle | Libellé | Population estimée | Mode d'accès |
|---|---|---|---|
| `CLIENT` | Client | Plusieurs dizaines à centaines | Externe à TECHDIFRIK, accès web |
| `GESTIONNAIRE` | Gestionnaire | 2 à 5 personnes (équipe support) | Interne TECHDIFRIK |
| `RESPONSABLE` | Responsable | 5 à 20 personnes (équipes métier/technique) | Interne TECHDIFRIK |
| `ADMIN` | Administrateur | 1 à 2 personnes (équipe IT) | Interne TECHDIFRIK |
| `DG` | Direction Générale | 1 à 5 personnes (DG et N-1) | Interne TECHDIFRIK |

> **[EXG-02-001] (MUST)** Chaque utilisateur dispose d'un et d'un seul rôle. Le changement de rôle est tracé dans le journal d'audit.

## 2.2 Description détaillée par rôle

### 2.2.1 Client

**Description.** Personne morale ou physique cliente de TECHDIFRIK, autorisée à soumettre des demandes au nom de son organisation. Un compte Client est rattaché à une organisation cliente unique.

**Responsabilités.**

- Soumettre des demandes via la plateforme avec un niveau de détail suffisant à leur qualification.
- Répondre aux sollicitations du Gestionnaire ou du Responsable en cas de demande de complément.
- Évaluer la qualité du traitement à la clôture de chaque demande.
- Maintenir à jour ses coordonnées de contact.

**Limites de droits.**

- Le Client ne voit jamais que ses propres demandes — jamais celles d'un autre Client, jamais celles d'une autre organisation.
- Le Client ne peut pas fixer directement le niveau de priorité d'une demande (voir chapitre 05).
- Le Client ne peut pas réaffecter, transférer ou supprimer une demande après soumission.

**Cas particulier.** Une organisation cliente peut désigner plusieurs utilisateurs Client. **[EXG-02-002] (SHOULD)** Le MVP permet à plusieurs utilisateurs d'une même organisation cliente de voir et compléter mutuellement les demandes de leur organisation. Le contour exact (visibilité organisation entière vs périmètre par utilisateur) est à arbitrer.

### 2.2.2 Gestionnaire

**Description.** Collaborateur TECHDIFRIK chargé de la réception, qualification et affectation des demandes entrantes. Il constitue le point de bascule entre la demande brute du client et son traitement opérationnel.

**Responsabilités.**

- Examiner les demandes en statut `Nouvelle` et les qualifier (catégorie correcte, complétude des informations, doublon éventuel).
- Demander des compléments au Client si nécessaire (la demande passe alors en statut `En attente client`).
- Valider ou ajuster la priorité calculée par le système (voir chapitre 05).
- Affecter la demande au Responsable adéquat.
- Suivre la file d'attente globale et redistribuer en cas de surcharge d'un Responsable.
- Détecter les doublons et fusionner si nécessaire.

**Limites de droits.**

- Le Gestionnaire ne traite pas lui-même les demandes au fond — il oriente et coordonne.
- Le Gestionnaire ne peut pas modifier le contenu factuel d'une demande soumise par le Client (sauf typo manifeste, avec traçabilité).
- Le Gestionnaire ne peut pas clôturer définitivement une demande à la place du Responsable, sauf cas exceptionnel documenté.

### 2.2.3 Responsable

**Description.** Collaborateur TECHDIFRIK chargé du traitement opérationnel d'une demande affectée. Selon la catégorie, il peut s'agir d'un technicien support, d'un développeur, d'un chef de projet, etc.

**Responsabilités.**

- Prendre connaissance de la demande affectée et de son contexte.
- Communiquer avec le Client via la messagerie intégrée pour clarifier le besoin si nécessaire.
- Conduire le traitement (diagnostic, action corrective, livraison d'information, etc.).
- Mettre à jour le statut de la demande tout au long du traitement.
- Documenter la résolution dans la fiche de la demande.
- Proposer la clôture à la validation du Client.

**Limites de droits.**

- Le Responsable ne peut traiter que les demandes qui lui sont affectées (ou aux files d'attente d'équipe dont il est membre, V2).
- Le Responsable ne peut pas se réaffecter une demande qui ne lui est pas attribuée — il doit en faire la demande au Gestionnaire.
- Le Responsable ne peut pas modifier la priorité système ; seul le Gestionnaire le peut.

### 2.2.4 Administrateur

**Description.** Profil technique chargé de la configuration, des paramètres et de la gestion des comptes utilisateurs.

**Responsabilités.**

- Créer, modifier, désactiver les comptes utilisateurs (tous rôles).
- Gérer le catalogue des catégories de demandes et leur priorité par défaut.
- Gérer le catalogue des produits et services TECHDIFRIK référencés dans les formulaires de bug.
- Paramétrer les SLA cibles par priorité (sur validation DG).
- Gérer les modèles de courriels transactionnels.
- Consulter le journal d'audit complet.
- Restaurer un compte verrouillé ou réinitialiser un mot de passe.

**Limites de droits.**

- L'Administrateur ne traite pas de demandes (il peut consulter mais pas se les attribuer ni les clôturer).
- L'Administrateur ne consulte pas les données métier au-delà de ce que requiert le support utilisateur.
- Toute action de l'Administrateur sur un compte est tracée dans le journal d'audit, y compris la consultation de données nominatives.

### 2.2.5 Direction Générale

**Description.** Profil de consultation, sans capacité d'action opérationnelle. Destiné à la DG et à ses N-1 (directeurs de département) pour le pilotage.

**Responsabilités.**

- Consulter les tableaux de bord d'activité, qualité, satisfaction.
- Exporter les indicateurs pour analyse externe.
- Consulter les rapports périodiques.

**Limites de droits.**

- Aucun droit en écriture sur les demandes, les comptes ou la configuration.
- Accès en consultation uniquement aux agrégats et aux indicateurs — pas d'accès au contenu détaillé des demandes individuelles, sauf cas de besoin justifié (déclencheur d'audit consigné).

## 2.3 Matrice des droits d'accès

Légende : ✅ accès, ❌ pas d'accès, 👁️ lecture seule, ✏️ lecture + écriture sur son périmètre, 🔒 lecture + écriture restreinte, 📊 lecture agrégée uniquement.

| Action / Ressource | Client | Gestionnaire | Responsable | Admin | DG |
|---|:---:|:---:|:---:|:---:|:---:|
| **Authentification** ||||||
| Se connecter | ✅ | ✅ | ✅ | ✅ | ✅ |
| Modifier son profil | ✏️ | ✏️ | ✏️ | ✏️ | ✏️ |
| Modifier le profil d'autrui | ❌ | ❌ | ❌ | ✏️ | ❌ |
| **Demandes** ||||||
| Créer une demande | ✏️ | ❌ | ❌ | ❌ | ❌ |
| Consulter ses propres demandes | 👁️ | — | — | — | — |
| Consulter les demandes de son organisation | 👁️ | — | — | — | — |
| Consulter toutes les demandes | ❌ | 👁️ | 🔒 | 👁️ | 📊 |
| Qualifier une demande (catégorie, complétude) | ❌ | ✏️ | ❌ | ❌ | ❌ |
| Ajuster la priorité système | ❌ | ✏️ | ❌ | ❌ | ❌ |
| Affecter une demande à un Responsable | ❌ | ✏️ | ❌ | ❌ | ❌ |
| Traiter une demande affectée | ❌ | ❌ | ✏️ | ❌ | ❌ |
| Changer le statut d'une demande | ❌ | ✏️ | ✏️ | ❌ | ❌ |
| Clôturer une demande | ❌ | 🔒 | ✏️ | ❌ | ❌ |
| Réouvrir une demande clôturée | ✏️ | ✏️ | ❌ | ❌ | ❌ |
| Évaluer la satisfaction (clôture) | ✏️ | ❌ | ❌ | ❌ | ❌ |
| **Messagerie** ||||||
| Envoyer un message sur une demande | ✏️ | ✏️ | ✏️ | ❌ | ❌ |
| **Pièces jointes** ||||||
| Téléverser une pièce jointe | ✏️ | ✏️ | ✏️ | ❌ | ❌ |
| Télécharger une pièce jointe | 👁️ | 👁️ | 👁️ | 👁️ | ❌ |
| **Comptes utilisateurs** ||||||
| Créer / désactiver un compte | ❌ | ❌ | ❌ | ✏️ | ❌ |
| Lister tous les utilisateurs | ❌ | 👁️ | ❌ | ✏️ | ❌ |
| Réinitialiser un mot de passe utilisateur | ❌ | ❌ | ❌ | ✏️ | ❌ |
| **Catalogue (catégories, produits)** ||||||
| Consulter le catalogue | 👁️ | 👁️ | 👁️ | ✏️ | 👁️ |
| Modifier le catalogue | ❌ | ❌ | ❌ | ✏️ | ❌ |
| **Tableau de bord** ||||||
| Tableau de bord opérationnel (file d'attente) | ❌ | 👁️ | 👁️ | 👁️ | ❌ |
| Tableau de bord stratégique (indicateurs DG) | ❌ | ❌ | ❌ | 👁️ | 👁️ |
| Exporter les indicateurs (CSV) | ❌ | ❌ | ❌ | ✏️ | ✏️ |
| **Journal d'audit** ||||||
| Consulter ses propres actions | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ |
| Consulter toutes les actions | ❌ | ❌ | ❌ | 👁️ | ❌ |

> **[EXG-02-003] (MUST)** La matrice ci-dessus est la référence de l'autorisation. Toute API doit appliquer ces règles côté serveur ; les masquages côté client sont du confort d'interface uniquement et ne constituent pas une mesure de sécurité.

## 2.4 User stories par acteur

Les user stories suivent le format Connextra : `En tant que <rôle>, je veux <action>, afin de <bénéfice>`.

### 2.4.1 Client

| ID | User story | Priorité |
|---|---|:---:|
| US-CLI-01 | En tant que Client, je veux créer un compte ou recevoir un compte créé par TECHDIFRIK, afin de pouvoir accéder à la plateforme. | MUST |
| US-CLI-02 | En tant que Client, je veux soumettre une demande en sélectionnant une catégorie, afin d'obtenir un formulaire adapté à mon besoin. | MUST |
| US-CLI-03 | En tant que Client, je veux signaler un bug en remplissant un formulaire structuré, afin que le diagnostic soit rapide. | MUST |
| US-CLI-04 | En tant que Client, je veux décrire l'impact métier et l'urgence ressentie sans choisir directement la priorité, afin que celle-ci soit calculée objectivement. | MUST |
| US-CLI-05 | En tant que Client, je veux joindre des fichiers (captures d'écran, logs, documents), afin d'illustrer ma demande. | MUST |
| US-CLI-06 | En tant que Client, je veux suivre l'état d'avancement de mes demandes en temps réel, afin de ne pas avoir à relancer par téléphone ou courriel. | MUST |
| US-CLI-07 | En tant que Client, je veux échanger avec mon interlocuteur via une messagerie intégrée à chaque demande, afin de conserver l'historique. | MUST |
| US-CLI-08 | En tant que Client, je veux recevoir des notifications par courriel à chaque changement d'état, afin d'être tenu informé sans devoir me reconnecter. | MUST |
| US-CLI-09 | En tant que Client, je veux évaluer la qualité de traitement à la clôture (note + commentaire), afin d'exprimer ma satisfaction. | MUST |
| US-CLI-10 | En tant que Client, je veux pouvoir réouvrir une demande clôturée si le problème persiste, afin de relancer le traitement sans recréer un ticket. | MUST |
| US-CLI-11 | En tant que Client, je veux consulter mon historique complet de demandes, afin de retrouver une demande passée. | MUST |
| US-CLI-12 | En tant que Client, je veux réinitialiser mon mot de passe en autonomie, afin de ne pas dépendre du support. | MUST |

### 2.4.2 Gestionnaire

| ID | User story | Priorité |
|---|---|:---:|
| US-GES-01 | En tant que Gestionnaire, je veux voir la file d'attente globale des demandes `Nouvelles`, afin de qualifier sans en oublier. | MUST |
| US-GES-02 | En tant que Gestionnaire, je veux filtrer la file d'attente (par priorité, catégorie, ancienneté, organisation), afin de prioriser mon travail. | MUST |
| US-GES-03 | En tant que Gestionnaire, je veux valider ou ajuster la priorité système d'une demande, afin de tenir compte du contexte global. | MUST |
| US-GES-04 | En tant que Gestionnaire, je veux affecter une demande à un Responsable, afin d'amorcer le traitement. | MUST |
| US-GES-05 | En tant que Gestionnaire, je veux demander des compléments au Client (statut `En attente client`), afin de qualifier correctement. | MUST |
| US-GES-06 | En tant que Gestionnaire, je veux identifier les doublons et les fusionner, afin d'éviter le travail redondant. | SHOULD |
| US-GES-07 | En tant que Gestionnaire, je veux voir la charge actuelle de chaque Responsable, afin d'équilibrer les affectations. | SHOULD |
| US-GES-08 | En tant que Gestionnaire, je veux réaffecter une demande en cas d'erreur d'affectation initiale, afin de corriger sans recréer de ticket. | MUST |
| US-GES-09 | En tant que Gestionnaire, je veux justifier toute modification de priorité (motif), afin de conserver une traçabilité. | MUST |

### 2.4.3 Responsable

| ID | User story | Priorité |
|---|---|:---:|
| US-RES-01 | En tant que Responsable, je veux voir la liste des demandes qui me sont affectées, afin de planifier mon travail. | MUST |
| US-RES-02 | En tant que Responsable, je veux trier ma file par priorité et SLA cible, afin de respecter les engagements. | MUST |
| US-RES-03 | En tant que Responsable, je veux échanger avec le Client via la messagerie intégrée, afin de clarifier le besoin. | MUST |
| US-RES-04 | En tant que Responsable, je veux faire avancer le statut d'une demande (en cours, en attente client, résolue), afin de refléter le traitement. | MUST |
| US-RES-05 | En tant que Responsable, je veux documenter la résolution dans la fiche, afin que l'historique soit exploitable. | MUST |
| US-RES-06 | En tant que Responsable, je veux proposer la clôture en sollicitant la validation du Client, afin de ne pas clôturer unilatéralement. | MUST |
| US-RES-07 | En tant que Responsable, je veux marquer une demande comme bloquée et solliciter le Gestionnaire (réaffectation, escalade), afin de débloquer la situation. | SHOULD |

### 2.4.4 Administrateur

| ID | User story | Priorité |
|---|---|:---:|
| US-ADM-01 | En tant qu'Administrateur, je veux créer un compte utilisateur d'un rôle quelconque, afin de provisionner les accès. | MUST |
| US-ADM-02 | En tant qu'Administrateur, je veux désactiver un compte sans le supprimer, afin de préserver l'historique. | MUST |
| US-ADM-03 | En tant qu'Administrateur, je veux gérer le catalogue des catégories de demandes et leur priorité par défaut, afin d'adapter à l'évolution des activités. | MUST |
| US-ADM-04 | En tant qu'Administrateur, je veux gérer le catalogue des produits/services référencés dans les bugs, afin de garantir la cohérence. | MUST |
| US-ADM-05 | En tant qu'Administrateur, je veux paramétrer les SLA cibles par priorité (sur validation DG), afin d'aligner sur la stratégie de service. | MUST |
| US-ADM-06 | En tant qu'Administrateur, je veux gérer les modèles de courriels transactionnels, afin de personnaliser la communication. | SHOULD |
| US-ADM-07 | En tant qu'Administrateur, je veux consulter le journal d'audit complet et y rechercher, afin d'investiguer en cas d'incident. | MUST |
| US-ADM-08 | En tant qu'Administrateur, je veux réinitialiser le mot de passe d'un utilisateur, afin de débloquer un cas de support. | MUST |

### 2.4.5 Direction Générale

| ID | User story | Priorité |
|---|---|:---:|
| US-DG-01 | En tant que membre de la DG, je veux consulter un tableau de bord temps réel des indicateurs clés, afin de piloter l'activité. | MUST |
| US-DG-02 | En tant que membre de la DG, je veux exporter les indicateurs en CSV sur une période, afin d'alimenter une analyse externe. | MUST |
| US-DG-03 | En tant que membre de la DG, je veux comparer les indicateurs entre mois/trimestres, afin d'apprécier les tendances. | SHOULD |
| US-DG-04 | En tant que membre de la DG, je veux voir le palmarès des produits les plus signalés en bugs, afin d'arbitrer les investissements qualité. | MUST |
| US-DG-05 | En tant que membre de la DG, je veux voir la satisfaction client par période et par responsable, afin d'identifier des leviers d'amélioration. | SHOULD |
