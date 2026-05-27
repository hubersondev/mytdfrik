# 01 — Contexte, enjeux et objectifs

## 1.1 Contexte de l'entreprise

TECHDIFRIK est en phase de croissance dynamique. Cette croissance fait émerger un besoin structurel : organiser durablement la relation client. Aujourd'hui, les demandes des clients entrent dans l'entreprise par des canaux hétérogènes (appels téléphoniques, courriels, échanges informels), ce qui produit trois conséquences opérationnelles :

1. **Perte de traçabilité** — une demande verbalisée par téléphone n'a pas d'existence formelle dans le système d'information ; elle dépend de la mémoire d'un collaborateur.
2. **Lenteur de traitement** — l'absence de file d'attente partagée empêche toute priorisation rationnelle et conduit à des doublons ou des oublis.
3. **Fragilité de la perception de qualité** — le client ne dispose d'aucune visibilité sur l'avancement de sa demande et doit relancer pour s'informer, ce qui dégrade l'expérience perçue.

La Direction Générale a décidé de mettre fin à cette situation en imposant un point d'entrée unique et officiel pour toute sollicitation client. C'est l'objet du projet **MyTDFRIK**.

## 1.2 Enjeux stratégiques

Le projet poursuit quatre enjeux dont les retombées dépassent la simple modernisation outil :

| Enjeu | Description |
|---|---|
| Confiance | Donner au client la preuve, à tout moment, que sa demande est enregistrée, suivie et traitée. |
| Fidélisation | Mesurer objectivement la qualité de service rendue et constituer un historique partagé client/entreprise. |
| Industrialisation | Formaliser un circuit unique : soumission → qualification → affectation → traitement → clôture, reproductible et auditables. |
| Pilotage | Doter la Direction Générale d'indicateurs fiables (volumes, délais, satisfaction, charge) pour orienter les décisions stratégiques. |

## 1.3 Objectifs du projet

### 1.3.1 Objectifs métier

- **[EXG-01-001] (MUST)** Centraliser 100 % des demandes clients sur la plateforme dans les douze mois suivant la mise en production.
- **[EXG-01-002] (MUST)** Réduire le délai moyen de prise en charge d'une demande (entre soumission et première action qualifiée par un gestionnaire) en dessous des seuils définis au chapitre 05 (SLA par priorité).
- **[EXG-01-003] (MUST)** Fournir à chaque client la visibilité temps réel sur l'état de ses demandes, sans nécessiter de relance téléphonique ou par courriel.
- **[EXG-01-004] (MUST)** Capitaliser sur les signalements de bugs pour alimenter une boucle d'amélioration continue des produits TECHDIFRIK.
- **[EXG-01-005] (SHOULD)** Mesurer la satisfaction client à la clôture de chaque ticket et exploiter le NPS résultant.

### 1.3.2 Objectifs produit

- **[EXG-01-006] (MUST)** Livrer un MVP fonctionnel couvrant le cycle de vie complet d'une demande (voir chapitre 04).
- **[EXG-01-007] (MUST)** Garantir le multi-rôles dès le MVP : Client, Gestionnaire, Responsable, Administrateur, Direction Générale (voir chapitre 02).
- **[EXG-01-008] (MUST)** Implémenter un mécanisme de priorisation objectif inspiré ITIL (voir chapitre 05), interdisant au client de fixer librement la priorité.
- **[EXG-01-009] (MUST)** Traiter le signalement structuré des bugs comme un canal de premier plan, et non comme une simple sous-catégorie (voir chapitre 06).

## 1.4 Périmètre macro

### 1.4.1 Inclus dans le MVP

- Authentification multi-rôles et gestion des droits d'accès.
- Création de demandes catégorisées avec formulaires adaptatifs.
- Formulaire dédié de signalement de bugs (champs structurés diagnostics).
- Tableau de bord de qualification et d'affectation (Gestionnaire).
- Espace de traitement (Responsable) avec messagerie client intégrée.
- Suivi temps réel par le client, avec historique consultable.
- Notifications par courriel et notifications in-app temps réel.
- Évaluation de satisfaction à la clôture.
- Tableau de bord d'indicateurs pour la Direction Générale.
- Journal d'audit complet de toutes les transitions d'état.

### 1.4.2 Explicitement exclus du MVP (V2 ou ultérieur)

- **[EXG-01-010] (WONT au MVP)** Notifications par SMS et WhatsApp Business.
- **[EXG-01-011] (WONT au MVP)** Engagement de service (SLA) automatique avec alertes de dépassement — la mesure des délais est faite, mais les alertes proactives sont V2.
- **[EXG-01-012] (WONT au MVP)** Base de connaissances et FAQ en libre-service côté client.
- **[EXG-01-013] (WONT au MVP)** Application mobile native (l'application web sera toutefois responsive et "mobile-first").
- **[EXG-01-014] (WONT au MVP)** Intégration avec les systèmes comptables et de facturation.
- **[EXG-01-015] (WONT au MVP)** Business Intelligence avancée (tableaux croisés, exports OLAP). Le MVP fournira un tableau de bord temps réel et des exports CSV simples.
- **[EXG-01-016] (WONT au MVP)** Intégration avec un outil de suivi de bugs interne (Jira, GitHub Issues). Les bugs sont gérés dans MyTDFRIK uniquement.
- **[EXG-01-017] (WONT au MVP)** Authentification fédérée (SSO, OAuth tiers).

## 1.5 Hypothèses

| Code | Hypothèse |
|---|---|
| H1 | Le portefeuille client de TECHDIFRIK est connu et stable, et chaque client dispose d'au moins un référent métier identifiable comme utilisateur de la plateforme. |
| H2 | Les volumétries cibles du MVP restent dans un ordre de grandeur compatible avec une architecture mono-instance (estimation à préciser au chapitre 11). |
| H3 | Le multilinguisme n'est pas requis au MVP : l'interface est exclusivement en **français**. |
| H4 | Les clients disposent d'une connexion internet suffisante pour utiliser une application web moderne. Un canal de secours par courriel reste maintenu pour les zones à connectivité limitée. |
| H5 | Les ressources de développement internes du Département Développement seront affectées au projet à temps plein pendant la phase de réalisation. |

## 1.6 Contraintes

| Code | Contrainte | Impact |
|---|---|---|
| C1 | Conformité RGPD obligatoire (données nominatives clients et collaborateurs). | Voir chapitre 10. |
| C2 | Disponibilité d'un canal de secours indépendant pour signaler les bugs de la plateforme elle-même. | L'indisponibilité de MyTDFRIK ne doit pas bloquer la possibilité de la signaler. |
| C3 | Le client ne doit jamais pouvoir fixer directement le niveau de priorité d'une demande. | Voir chapitre 05 — la priorité est calculée, pas saisie. |
| C4 | Le stockage des pièces jointes doit reposer sur un service compatible Amazon S3 (S3, MinIO, Wasabi). | Voir chapitre 11. |
| C5 | Les mots de passe doivent être stockés sous forme de hash résistant (bcrypt ou argon2), jamais en clair ni en MD5/SHA1. | Voir chapitre 10. |
| C6 | Toutes les communications entre client et serveur doivent être chiffrées via HTTPS (TLS 1.2 minimum, TLS 1.3 recommandé). | Voir chapitre 10. |
| C7 | Les sauvegardes doivent être chiffrées et exécutées quotidiennement. | Voir chapitre 10. |

## 1.7 Risques projet majeurs identifiés

Repris et précisés à partir de la note de cadrage v1.1 :

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Faible adoption par les clients | Moyenne | Élevé | Accompagnement personnalisé, supports de formation, communication soutenue au lancement, sponsoring de la Direction Générale. |
| Résistance interne au changement de process | Moyenne | Moyen | Implication des équipes Gestionnaire et Responsable dès la phase de cadrage, sessions de formation dédiées, ambassadeurs internes. |
| Brèche de sécurité des données clients | Faible | Très élevé | Audits réguliers, sauvegardes chiffrées, plan de reprise d'activité, conformité RGPD documentée (voir chapitre 10). |
| Indisponibilité de la plateforme en zone à connectivité limitée | Élevée | Faible | Maintien d'un canal courriel de secours pour les zones concernées (canal officiel : courriel dédié `support@techdifrik.com` [À VALIDER]). |
| Sous-estimation de la charge de qualification par le Gestionnaire | Moyenne | Moyen | Dimensionnement de l'équipe à partir d'une volumétrie cible mesurée pendant la phase pilote ; possibilité d'introduire des gestionnaires supplémentaires sans changement applicatif. |

## 1.8 Critères de succès du projet

Le projet sera considéré comme réussi si, dans les six mois suivant la mise en production :

- **CS1** : Au moins 90 % des nouvelles demandes clients sont créées via MyTDFRIK (vs canaux historiques).
- **CS2** : Le délai moyen de première réponse qualifiée respecte les SLA du chapitre 05 sur l'ensemble des priorités.
- **CS3** : Le taux de satisfaction moyen à la clôture est supérieur ou égal à 4/5.
- **CS4** : Le taux de réouverture des tickets clôturés reste inférieur à 5 %.
- **CS5** : Aucune fuite de données nominatives, aucun incident de sécurité majeur (niveau ANSSI ≥ 3).
