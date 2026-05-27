# 12 — Cahier de recette

## 12.1 Stratégie de test générale

### 12.1.1 Pyramide de tests

| Niveau | Cible | Outils types | Couverture attendue MVP |
|---|---|---|---|
| Tests unitaires | Logique métier pure (calcul de priorité, validateurs, formateurs, machine à états) | Jest / PHPUnit / Pytest selon stack | ≥ 80 % du code métier |
| Tests d'intégration | Endpoints API, accès base, scripts SQL, intégration avec service de courriel et S3 (mocks réalistes) | Supertest / Pest / pytest-httpx | Tous les endpoints critiques |
| Tests end-to-end | Parcours utilisateurs principaux à travers l'UI | Playwright / Cypress | Voir §12.3 |
| Tests de charge | Capacité à supporter la charge cible | k6 / Locust | Voir chapitre 11 §11.1.3 |
| Tests d'accessibilité | Conformité WCAG 2.1 AA | axe-core, Lighthouse | Audits par écran principal |
| Tests de sécurité | OWASP Top 10 | OWASP ZAP, pentest manuel | Voir chapitre 10 §10.11 |

### 12.1.2 Recette utilisateur (UAT)

- **[EXG-12-001] (MUST)** Une **recette utilisateur** structurée est conduite avant la mise en production, impliquant au moins :
  - 2 utilisateurs représentatifs du rôle Client (provenant de clients pilotes consentants).
  - 1 Gestionnaire.
  - 2 Responsables (techniciens support et chefs de projet).
  - 1 Administrateur.
  - 1 représentant DG.
- **[EXG-12-002] (MUST)** La recette suit les scénarios formalisés en §12.3. Chaque scénario produit un PV (procès-verbal) signé par l'utilisateur et le Département Développement.
- **[EXG-12-003] (MUST)** La recette est exécutée sur l'environnement de **staging** iso-prod (chapitre 11 §11.9.1).
- **[EXG-12-004] (MUST)** Les anomalies détectées sont catégorisées (bloquantes / majeures / mineures) et traitées selon les règles de §12.4.

## 12.2 Critères d'acceptation par module

### 12.2.1 Authentification (M01)

- ☐ Un utilisateur peut se connecter avec des identifiants valides.
- ☐ Un identifiant invalide retourne un message générique sans révéler quel champ est erroné.
- ☐ 5 échecs consécutifs verrouillent le compte ; courriel de verrouillage envoyé.
- ☐ La réinitialisation par lien à usage unique fonctionne et invalide les sessions précédentes.
- ☐ La déconnexion volontaire révoque la session.
- ☐ L'inactivité au-delà du seuil paramétré déconnecte automatiquement.
- ☐ Le refresh token est utilisable une seule fois (rotation).

### 12.2.2 Gestion des comptes (M02)

- ☐ L'Administrateur peut créer un compte de chaque rôle ; courriel d'activation envoyé.
- ☐ Le titulaire peut définir son premier mot de passe via le lien d'activation.
- ☐ Le changement de courriel exige la double validation (ancien + nouveau).
- ☐ Un compte désactivé conserve son historique mais ne peut plus se connecter.
- ☐ La modification du profil est tracée dans le journal d'audit.

### 12.2.3 Création de demande (M03)

- ☐ Un Client peut créer une demande dans chaque catégorie active.
- ☐ Les champs obligatoires sont validés côté serveur.
- ☐ Le brouillon est sauvegardé à chaque étape et restauré à la reconnexion (dans la limite de 30 jours).
- ☐ L'identifiant `MTF-AAAAMMJJ-NNNN` est généré et affiché.
- ☐ Aucun champ « priorité » saisissable directement n'apparaît dans l'interface Client.

### 12.2.4 Catégorisation et catalogue (M04)

- ☐ L'Administrateur peut créer, modifier, désactiver une catégorie.
- ☐ Désactiver une catégorie ne supprime pas les demandes existantes mais la retire de la création.
- ☐ Le formulaire affiché varie selon la catégorie (notamment formulaire bug pour catégorie « Bug »).

### 12.2.5 Qualification et affectation (M05)

- ☐ Le Gestionnaire voit la file `Nouvelles` et peut filtrer/trier.
- ☐ Il peut reclasser la catégorie, justifier un ajustement de priorité, demander un complément, affecter à un Responsable nominal.
- ☐ Tout ajustement de priorité impose un motif.
- ☐ L'affectation à un Responsable inactif est refusée.

### 12.2.6 Priorisation (chapitre 05)

- ☐ La matrice Impact × Urgence donne le bon résultat pour les 16 combinaisons (voir §12.3.2).
- ☐ La pondération par catégorie n'élève que vers une priorité plus forte, jamais l'inverse.
- ☐ L'override par le Gestionnaire est borné à ± 1 niveau et impose un motif.
- ☐ La `system_priority` n'est jamais modifiée a posteriori.

### 12.2.7 Cycle de vie (chapitre 04)

- ☐ Les 19 transitions T01 à T19 fonctionnent dans les conditions définies.
- ☐ Les transitions interdites retournent 409 ou 403 selon le cas.
- ☐ Le statut antérieur est correctement repris lors de la sortie de `EN_ATTENTE_CLIENT`.
- ☐ Le temps en `EN_ATTENTE_CLIENT` est exclu du calcul des SLA.

### 12.2.8 Messagerie (M07)

- ☐ Les messages sont horodatés et signés.
- ☐ Les messages internes ne sont jamais visibles du Client (testé côté API et UI).
- ☐ Un message envoyé n'est pas modifiable ; il peut être retiré avec motif.

### 12.2.9 Pièces jointes (M08)

- ☐ Les formats autorisés sont acceptés ; les autres refusés.
- ☐ Les fichiers > 25 Mo sont refusés avec un message clair.
- ☐ Un fichier en cours d'analyse antivirus n'est pas téléchargeable.
- ☐ Un fichier infecté est rejeté et l'auteur notifié.

### 12.2.10 Signalement de bugs (chapitre 06)

- ☐ Le formulaire structuré apparaît à la sélection d'une catégorie `requires_bug_details = true`.
- ☐ Les champs obligatoires conditionnels (`environment_os` si `requires_os = true`) sont bien imposés.
- ☐ Le Responsable peut renseigner `is_reproduced`, `root_cause`, `corrective_action`, `workaround`.
- ☐ Une fiche de bug clôturée avec `root_cause` et `corrective_action` documentés est suggérée à un Responsable traitant un cas similaire.

### 12.2.11 Notifications (chapitre 07)

- ☐ Chaque événement déclenche les notifications définies dans la matrice §7.3.
- ☐ Les courriels sont multipart (HTML + texte) et signés (SPF/DKIM/DMARC).
- ☐ Le badge in-app reflète le nombre de notifications non lues.
- ☐ Les notifications critiques (`COMPTE_VERROUILLE`, etc.) sont envoyées même quand l'utilisateur a désactivé les notifications.
- ☐ Les WebSocket diffusent les événements en temps réel à un utilisateur connecté ; en absence de session, l'in-app prend le relais.

### 12.2.12 Clôture et évaluation (M11)

- ☐ Une `RESOLUTION_PROPOSEE` non validée dans 7 jours devient `CLOTUREE` automatiquement.
- ☐ L'évaluation est demandée à la clôture ; note 1-5 + commentaire optionnel.
- ☐ Une note ≤ 2 déclenche une notification au Gestionnaire.

### 12.2.13 Réouverture (M12)

- ☐ Une demande peut être réouverte dans les 30 jours suivant la clôture, max 2 fois.
- ☐ La priorité est réhaussée d'un cran (plafond P1) à chaque réouverture.
- ☐ Au-delà de la limite, la réouverture est refusée avec message clair.

### 12.2.14 Tableaux de bord (M13)

- ☐ Les indicateurs DG s'affichent correctement et reflètent les données de la base sur la période sélectionnée.
- ☐ L'export CSV produit un fichier valide importable dans un tableur.
- ☐ Le tableau de bord stratégique se charge dans le temps cible (chapitre 11).

### 12.2.15 Administration (M14)

- ☐ Toutes les actions d'administration (CRUD catégories, produits, utilisateurs, SLA) sont accessibles uniquement au rôle `ADMIN`.
- ☐ Les paramètres modifiables (durée de session, délai de validation de clôture, etc.) sont effectivement pris en compte sans redéploiement.

### 12.2.16 Journal d'audit (M15)

- ☐ Toutes les actions listées au chapitre 10 §10.6 sont consignées.
- ☐ Le journal est filtrable par acteur, action, objet, période.
- ☐ Aucune entrée n'est modifiable ni supprimable (vérifié par tentative SQL).

## 12.3 Scénarios de recette utilisateur

### 12.3.1 Scénario 1 — Parcours nominal Client

**Acteurs.** Client, Gestionnaire, Responsable.

**Préconditions.** Compte Client actif rattaché à une organisation ; catégorie « Demande d'information » active.

**Déroulé.**

1. Le Client se connecte.
2. Il crée une demande de catégorie « Demande d'information » avec impact `DEGRADATION`, urgence `MODEREE`.
3. **Vérifier** : `system_priority = P3`, statut = `NOUVELLE`, identifiant `MTF-…` affiché.
4. Le Gestionnaire reçoit la notification, qualifie la demande, valide la priorité et l'affecte au Responsable.
5. **Vérifier** : transition T02 puis T06 effectives, Responsable notifié par courriel.
6. Le Responsable prend en charge (T08), répond via la messagerie.
7. **Vérifier** : Client notifié, statut `EN_COURS`, horodatage `first_response_at` renseigné.
8. Le Client répond ; statut reste `EN_COURS`.
9. Le Responsable propose la résolution (T11).
10. Le Client valide (T16) et soumet une évaluation 5/5.
11. **Vérifier** : statut `CLOTUREE`, évaluation enregistrée, indicateurs DG mis à jour.

**Critères de succès.** Tous les statuts, notifications et horodatages sont cohérents avec les chapitres 04 et 07.

### 12.3.2 Scénario 2 — Validation exhaustive de la matrice de priorisation

**But.** Vérifier que les 16 combinaisons Impact × Urgence produisent la bonne `system_priority`.

**Déroulé.** Le testeur crée 16 demandes successives en faisant varier Impact et Urgence, et vérifie la priorité calculée :

| # | Impact | Urgence | Priorité attendue |
|---|---|---|---|
| 1 | Service totalement bloqué | Critique | P0 |
| 2 | Service totalement bloqué | Élevée | P1 |
| 3 | Service totalement bloqué | Modérée | P1 |
| 4 | Service totalement bloqué | Faible | P2 |
| 5 | Service partiellement bloqué | Critique | P1 |
| 6 | Service partiellement bloqué | Élevée | P2 |
| 7 | Service partiellement bloqué | Modérée | P2 |
| 8 | Service partiellement bloqué | Faible | P3 |
| 9 | Fonctionnement dégradé | Critique | P2 |
| 10 | Fonctionnement dégradé | Élevée | P2 |
| 11 | Fonctionnement dégradé | Modérée | P3 |
| 12 | Fonctionnement dégradé | Faible | P4 |
| 13 | Aucun impact opérationnel | Critique | P3 |
| 14 | Aucun impact opérationnel | Élevée | P3 |
| 15 | Aucun impact opérationnel | Modérée | P4 |
| 16 | Aucun impact opérationnel | Faible | P4 |

**Critères de succès.** Les 16 priorités calculées correspondent exactement à la matrice du chapitre 05 §5.4.

### 12.3.3 Scénario 3 — Signalement de bug structuré

**Acteurs.** Client, Gestionnaire, Responsable technique.

**Déroulé.**

1. Le Client soumet un signalement de bug avec : produit `TDFK_ONLINE`, version `3.4.2`, impact `BLOCAGE_TOTAL`, urgence `CRITIQUE`, `is_blocking = true`.
2. **Vérifier** : `system_priority = P0` (matrice), formulaire bug rempli avec champs structurés.
3. Le Gestionnaire qualifie : confirme qu'il s'agit bien d'un bug, affecte au Responsable technique du catalogue.
4. Le Responsable reproduit le bug (`is_reproduced = OUI`), documente `root_cause`, propose un `workaround`.
5. Le Responsable applique le correctif (`fix_deployed = true`) et propose la résolution.
6. Le Client valide.
7. **Vérifier** : la fiche est marquée éligible à la base de connaissances et indexée.

**Critères de succès.** Le bug est tracé bout en bout, le délai de correction est mesuré, la fiche enrichit la base.

### 12.3.4 Scénario 4 — Override de priorité par le Gestionnaire

**Acteurs.** Client, Gestionnaire.

**Déroulé.**

1. Le Client soumet une demande dont la matrice donne `system_priority = P3`.
2. Le Gestionnaire estime que le contexte global (présence d'un événement client, ou redondance avec une crise en cours) justifie P2.
3. **Vérifier** : l'override est accepté avec un motif obligatoire. `effective_priority = P2`, l'historique mentionne la modification.
4. Le Gestionnaire tente un override à P0 (différence de 3 niveaux).
5. **Vérifier** : refus, message indiquant qu'il faut passer par une demande à l'Administrateur.
6. Le Client consulte la demande.
7. **Vérifier** : le Client voit le motif d'override.

### 12.3.5 Scénario 5 — Réouverture multiple et plafonnement

**Déroulé.**

1. Une demande P3 est clôturée.
2. Le Client réouvre : priorité passe à P2, `reopen_count = 1`.
3. Le Responsable retraite, clôture.
4. Le Client réouvre à nouveau : priorité passe à P1, `reopen_count = 2`.
5. Le Responsable retraite, clôture.
6. Le Client tente une 3e réouverture.
7. **Vérifier** : refus, message clair, indication de recréer une demande référençant l'historique.

### 12.3.6 Scénario 6 — Indisponibilité de la plateforme

**Déroulé.**

1. Simuler l'indisponibilité de l'API (arrêt du backend en staging).
2. **Vérifier** : la page d'erreur 503 personnalisée s'affiche, mentionnant l'adresse courriel de secours et le lien vers la page de statut.
3. **Vérifier** : la page de statut publique (hébergée séparément) reste accessible.
4. Le Client envoie un courriel à l'adresse de secours.
5. **Vérifier** : l'équipe IT reçoit le courriel.

### 12.3.7 Scénario 7 — Tentative d'élévation de privilèges

**Déroulé.**

1. Un Client connecté tente, via outils de développement, d'appeler `POST /api/v1/requests/{id}/transitions/assign` avec son propre jeton.
2. **Vérifier** : retour 403, action consignée au journal d'audit (catégorie `TRANSITION_INTERDITE`).
3. Le Client A tente d'accéder à la demande d'un Client B d'une autre organisation.
4. **Vérifier** : retour 404 (masquage par autorisation, voir §10.3 [EXG-10-052]).
5. Le Client tente de modifier `effective_priority` via PATCH direct.
6. **Vérifier** : retour 403, journal d'audit.

### 12.3.8 Scénario 8 — Test du verrouillage de compte

**Déroulé.**

1. Tenter 5 fois de se connecter avec un mauvais mot de passe.
2. **Vérifier** : le compte est verrouillé pour 15 minutes, courriel envoyé au titulaire.
3. **Vérifier** : l'Administrateur peut déverrouiller manuellement.
4. **Vérifier** : l'entrée correspondante existe dans le journal d'audit.

### 12.3.9 Scénario 9 — RGPD : export et anonymisation

**Déroulé.**

1. Un utilisateur demande l'export de ses données depuis son profil.
2. **Vérifier** : un fichier JSON + ZIP des pièces jointes est généré et téléchargeable.
3. L'utilisateur exerce son droit à l'effacement.
4. L'Administrateur traite la demande.
5. **Vérifier** : les champs nominatifs sont anonymisés, l'`id` et les liens vers les demandes restent, le journal d'audit consigne l'opération.

### 12.3.10 Scénario 10 — Charge nominale et pic

**Déroulé.** Exécuter le test de charge §11.1.3 sur l'environnement iso-prod.

**Critères de succès.** Les temps de réponse P95 restent en dessous des cibles, aucune erreur 5xx, le système se stabilise après le pic sans intervention manuelle.

## 12.4 Classification et traitement des anomalies

| Sévérité | Critère | Effet sur la recette | Délai de traitement |
|---|---|---|---|
| **Bloquante** | Empêche d'utiliser un parcours essentiel ; risque de sécurité avéré ; perte ou corruption de données. | Recette suspendue ; correction obligatoire avant reprise. | Sous 48 h |
| **Majeure** | Dysfonctionnement notable mais contournable ; impacte une fonctionnalité non essentielle. | Recette poursuivie ; correction obligatoire avant mise en production. | Avant MEP |
| **Mineure** | Défaut d'ergonomie, typographie, comportement non bloquant. | Recette poursuivie ; correction planifiée post-MEP si besoin. | Sprint suivant |

- **[EXG-12-010] (MUST)** Toute anomalie détectée est consignée dans MyTDFRIK lui-même (effet « dogfooding »), en catégorie « Bug interne MVP ».

## 12.5 Critères de mise en production (Definition of Done globale)

La mise en production du MVP est conditionnée à la **totalité** des critères ci-dessous :

- ☐ Tous les scénarios de recette §12.3 sont validés (PV signés).
- ☐ Aucune anomalie bloquante ou majeure ouverte.
- ☐ Couverture de tests automatisés ≥ 80 % sur la logique métier.
- ☐ Test de charge réussi (§11.1.3) avec respect des cibles.
- ☐ Pentest externe réalisé, aucune vulnérabilité critique ou élevée non résolue.
- ☐ Audit d'accessibilité réalisé, conformité WCAG 2.1 AA atteinte.
- ☐ Plan de reprise testé (restauration complète sur environnement isolé).
- ☐ Documentation utilisateur disponible (guide rapide par rôle).
- ☐ Documentation technique à jour (README, OpenAPI, ADRs).
- ☐ Journal d'audit fonctionnel et requêtable.
- ☐ Monitoring et alerting opérationnels sur la production.
- ☐ Sauvegardes et rétention configurées et testées.
- ☐ DPO désigné et registre des traitements RGPD signé.
- ☐ Procédure d'incident formalisée et communiquée à l'équipe IT.
- ☐ Comité de pilotage final approuvant la bascule.

## 12.6 Procédure de bascule en production

### 12.6.1 J-7

- Communication aux clients pilotes : période de bascule, indisponibilité prévue, canal de secours.
- Annonce in-app à tous les utilisateurs existants (si une version antérieure existait — sinon S/O).
- Revue finale du plan de bascule en comité de pilotage.

### 12.6.2 J-1

- Sauvegarde complète des environnements existants.
- Gel des merges sur la branche principale.
- Tests de fumée sur l'environnement de pré-production.

### 12.6.3 Jour J (fenêtre de bascule)

1. Mise en mode maintenance (page 503 personnalisée).
2. Déploiement des artefacts validés en recette.
3. Application des migrations de base de données.
4. Vérifications de fumée par checklist (login chaque rôle, création demande, transition, notification).
5. Levée du mode maintenance.
6. Surveillance renforcée pendant 24 h.

### 12.6.4 J+1 à J+7

- Astreinte renforcée (P0 24/7, P1-P2 en heures ouvrées étendues).
- Comité quotidien de suivi.
- Communication transparente vers les clients pilotes en cas d'incident.

## 12.7 Plan de rollback

- **[EXG-12-020] (MUST)** Un plan de rollback est documenté et testé sur l'environnement de recette **avant** la bascule.
- **[EXG-12-021] (MUST)** Conditions de déclenchement du rollback :
  - Incident bloquant non résolu sous 2 heures après mise en production.
  - Corruption de données détectée.
  - Vulnérabilité de sécurité majeure découverte post-bascule.
- **[EXG-12-022] (MUST)** Le rollback rétablit l'état antérieur (artefacts + base de données). Si des données ont été créées entre la bascule et le rollback, elles sont exportées avant rollback et restaurées manuellement après le second déploiement.
