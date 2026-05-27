# A1 — Glossaire et acronymes

## A1.1 Glossaire métier

| Terme | Définition |
|---|---|
| **Affectation** | Action par laquelle un Gestionnaire attribue nominativement une demande qualifiée à un Responsable, qui en devient le traitant. |
| **Audit log** | Journal immuable consignant toutes les actions sensibles (authentification, transitions, modifications de configuration, accès aux données). Voir chapitre 10 §10.6. |
| **Brouillon** | État transitoire d'une demande en cours de création, non encore soumise. Conservé 30 jours. |
| **Bug** | Dysfonctionnement signalé sur un produit ou service de TECHDIFRIK. Traité via un formulaire structuré dédié (chapitre 06). |
| **Catégorie** | Classification métier d'une demande (Bug, Panne, Information, Évolution, Réclamation, etc.). Chaque catégorie porte une priorité par défaut. |
| **Clôture** | Statut final d'une demande, soit par validation explicite du Client, soit par expiration du délai de validation. |
| **Cycle de vie** | Suite ordonnée des statuts qu'une demande peut prendre, encadrée par la machine à états du chapitre 04. |
| **DAS / DPA** | *Data Processing Agreement*, contrat de sous-traitance RGPD signé avec chaque fournisseur traitant des données personnelles. |
| **Demande** | Sollicitation soumise par un Client via MyTDFRIK, suivant un cycle de vie formalisé. |
| **Demandeur** | Synonyme : Client auteur de la demande. |
| **DPO** | *Data Protection Officer* — délégué à la protection des données, désigné par TECHDIFRIK pour piloter la conformité RGPD. |
| **Effective priority** | Priorité réellement utilisée pour le tri et les SLA, égale à la `system_priority` sauf override du Gestionnaire. |
| **Évaluation** | Note de 1 à 5 (et commentaire optionnel) saisie par le Client à la clôture d'une demande. |
| **Gestionnaire** | Acteur interne TECHDIFRIK chargé de la qualification, de la priorisation finale et de l'affectation des demandes. Voir chapitre 02 §2.2.2. |
| **Impact métier** | Déclaration faite par le Client sur l'effet de la situation sur son activité, parmi 4 valeurs (chapitre 05 §5.2.2). |
| **Indicateur** | Mesure agrégée alimentant les tableaux de bord (volumes, délais, taux de satisfaction, etc.). |
| **JWT** | *JSON Web Token*, format de jeton porteur utilisé pour l'authentification API. |
| **Matrice de priorisation** | Tableau croisant Impact × Urgence pour calculer la priorité système. Chapitre 05 §5.4. |
| **Messagerie intégrée** | Espace d'échanges textuels rattaché à chaque demande, partagé entre Client, Gestionnaire et Responsable. |
| **MVP** | *Minimum Viable Product*, première version livrable du produit, couvrant les fonctionnalités essentielles. |
| **Override** | Modification par le Gestionnaire de la priorité calculée par le système. Bornée à ± 1 niveau, motivée et tracée. |
| **Pièce jointe** | Fichier téléversé par un utilisateur en complément d'une demande ou d'un message. Stockée sur S3, analysée par antivirus. |
| **PRA** | Plan de reprise d'activité — procédure documentée de restauration de la plateforme en cas d'incident majeur. |
| **Priorité système** | Niveau de priorité (`P0` à `P4`) calculé automatiquement par la matrice + pondération de catégorie. Non modifiable a posteriori. |
| **Public reference** | Identifiant humain d'une demande, sous forme `MTF-AAAAMMJJ-NNNN`, communiqué au Client à la soumission. |
| **Qualification** | Étape du cycle de vie où le Gestionnaire confirme la catégorie, vérifie la complétude et fixe la priorité effective. |
| **Réouverture** | Action par laquelle le Client relance une demande clôturée. Limitée à 2 réouvertures, dans les 30 jours. |
| **Responsable** | Acteur interne TECHDIFRIK affecté au traitement opérationnel d'une demande. Voir chapitre 02 §2.2.3. |
| **RGPD** | Règlement général sur la protection des données (UE 2016/679). Cadre légal applicable au traitement des données personnelles. |
| **RPO** | *Recovery Point Objective* — quantité maximale de données acceptable à perdre en cas d'incident. Voir [EXG-10-165]. |
| **RTO** | *Recovery Time Objective* — durée maximale acceptable de remise en service après incident. Voir [EXG-10-165]. |
| **SLA** | *Service Level Agreement* — engagement de service mesurable (délais de prise en charge et de résolution). Chapitre 05 §5.6. |
| **System priority** | Synonyme de priorité système (voir ci-dessus). |
| **Tableau de bord opérationnel** | Vue des files d'attente et de la charge destinée aux Gestionnaires, Responsables et Administrateurs. |
| **Tableau de bord stratégique** | Vue agrégée des indicateurs destinée à la Direction Générale. |
| **Ticket** | Synonyme informel de « demande ». |
| **Urgence métier** | Déclaration faite par le Client sur la temporalité du besoin, parmi 4 valeurs (chapitre 05 §5.2.3). |
| **V2** | Deuxième version du produit (post-MVP), regroupant les évolutions listées au chapitre 01 §1.4.2. |
| **WebSocket** | Protocole de communication bidirectionnelle utilisé pour les notifications temps réel. |

## A1.2 Acronymes techniques

| Acronyme | Signification |
|---|---|
| **AIPD** | Analyse d'impact relative à la protection des données. |
| **ANSSI** | Agence nationale française de la sécurité des systèmes d'information. |
| **API** | *Application Programming Interface*. |
| **CCT** | Clauses contractuelles types (RGPD). |
| **CDC** | Cahier des charges. |
| **CI/CD** | *Continuous Integration / Continuous Deployment*. |
| **CRUD** | *Create, Read, Update, Delete*. |
| **CSP** | *Content Security Policy*. |
| **CSRF** | *Cross-Site Request Forgery*. |
| **CSS** | *Cascading Style Sheets*. |
| **CVE** | *Common Vulnerabilities and Exposures*. |
| **DKIM** | *DomainKeys Identified Mail*. |
| **DMARC** | *Domain-based Message Authentication, Reporting and Conformance*. |
| **DPO** | *Data Protection Officer*. |
| **HTTP/HTTPS** | *Hypertext Transfer Protocol / Secure*. |
| **IP** | *Internet Protocol*. |
| **ITIL** | *Information Technology Infrastructure Library*. |
| **JSON** | *JavaScript Object Notation*. |
| **JWT** | *JSON Web Token*. |
| **MCO** | Maintien en conditions opérationnelles. |
| **MFA** | *Multi-Factor Authentication*. |
| **MIME** | *Multipurpose Internet Mail Extensions*. |
| **MVP** | *Minimum Viable Product*. |
| **NPS** | *Net Promoter Score*. |
| **OWASP** | *Open Web Application Security Project*. |
| **PRA** | Plan de reprise d'activité. |
| **PWA** | *Progressive Web App*. |
| **RBAC** | *Role-Based Access Control*. |
| **RGPD** | Règlement général sur la protection des données. |
| **S3** | *Simple Storage Service*, format de stockage objet d'Amazon, standard de fait. |
| **SAST** | *Static Application Security Testing*. |
| **SCA** | *Software Composition Analysis*. |
| **SLA** | *Service Level Agreement*. |
| **SMS** | *Short Message Service*. |
| **SPF** | *Sender Policy Framework*. |
| **SQL** | *Structured Query Language*. |
| **SSO** | *Single Sign-On*. |
| **TLS** | *Transport Layer Security*. |
| **TOTP** | *Time-based One-Time Password*. |
| **TTL** | *Time To Live*. |
| **UAT** | *User Acceptance Testing*. |
| **UTC** | *Coordinated Universal Time*. |
| **UUID** | *Universally Unique Identifier*. |
| **WAF** | *Web Application Firewall*. |
| **WCAG** | *Web Content Accessibility Guidelines*. |
| **XSS** | *Cross-Site Scripting*. |
