# A4 — Modèles de courriels transactionnels

Cette annexe spécifie les gabarits MVP listés au chapitre 07 §7.8. Les contenus sont des **modèles initiaux** ; l'Administrateur peut les ajuster sans déploiement (chapitre 03 §3.12).

## A4.1 Conventions

### A4.1.1 Variables disponibles

Toutes les variables sont injectées dans le moteur de gabarit (Mustache, Liquid ou équivalent). Liste de référence :

| Variable | Description |
|---|---|
| `{{recipient.first_name}}` | Prénom du destinataire. |
| `{{recipient.last_name}}` | Nom du destinataire. |
| `{{recipient.email}}` | Courriel du destinataire. |
| `{{request.public_reference}}` | Identifiant `MTF-AAAAMMJJ-NNNN`. |
| `{{request.title}}` | Titre de la demande. |
| `{{request.status_label}}` | Libellé public du statut courant. |
| `{{request.effective_priority_label}}` | Libellé public de la priorité. |
| `{{request.url}}` | Lien direct vers la fiche dans MyTDFRIK. |
| `{{actor.full_name}}` | Nom complet de l'acteur de l'action déclenchante. |
| `{{actor.role_label}}` | Libellé du rôle de l'acteur. |
| `{{action.summary}}` | Résumé textuel court de l'action. |
| `{{action.message_body}}` | Corps de message en cas de notification de messagerie. |
| `{{sla.first_response_due_at_local}}` | Échéance SLA prise en charge, formatée local. |
| `{{sla.resolution_due_at_local}}` | Échéance SLA résolution, formatée local. |
| `{{environment.app_name}}` | « MyTDFRIK ». |
| `{{environment.company_name}}` | « TECHDIFRIK ». |
| `{{environment.preferences_url}}` | Lien vers les préférences de notification du destinataire. |
| `{{environment.status_page_url}}` | URL publique de la page de statut. |

### A4.1.2 Squelette HTML commun

```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{{subject}}</title>
  </head>
  <body style="font-family: system-ui, sans-serif; color: #1f2937; max-width: 640px; margin: 0 auto;">
    <header style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">
      <strong>{{environment.app_name}}</strong> · {{environment.company_name}}
    </header>

    <main style="padding: 24px;">
      {{> content}}
    </main>

    <footer style="padding: 16px 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
      <p>Cet envoi est automatique — ne répondez pas à ce courriel. Pour échanger avec votre interlocuteur, utilisez la messagerie intégrée à MyTDFRIK.</p>
      <p><a href="{{environment.preferences_url}}">Gérer mes préférences de notification</a> · <a href="{{environment.status_page_url}}">État de la plateforme</a></p>
      <p>TECHDIFRIK · Conformément au RGPD, vous pouvez exercer vos droits depuis votre espace personnel.</p>
    </footer>
  </body>
</html>
```

### A4.1.3 Version texte brut commune

Chaque courriel HTML est accompagné d'une version texte brut équivalente, sans liens stylisés mais avec les URL complètes.

## A4.2 Gabarits

### A4.2.1 `ACCUSE_RECEPTION`

**Sujet.** `[MyTDFRIK] [{{request.public_reference}}] Votre demande a bien été enregistrée`

**Corps.**

> Bonjour {{recipient.first_name}},
>
> Votre demande **{{request.public_reference}}** *« {{request.title}} »* a bien été enregistrée le {{request.created_at_local}}.
>
> Elle est actuellement en statut **{{request.status_label}}** et a été classée en priorité **{{request.effective_priority_label}}**. Notre équipe la prendra en charge dans les meilleurs délais.
>
> Vous pouvez à tout moment suivre l'avancement, consulter l'historique et échanger avec votre interlocuteur depuis le lien ci-dessous :
>
> [Accéder à ma demande]({{request.url}})
>
> Délai cible de première réponse : {{sla.first_response_due_at_local}}.
>
> L'équipe TECHDIFRIK.

### A4.2.2 `DEMANDE_QUALIFIEE`

**Sujet.** `[MyTDFRIK] [{{request.public_reference}}] Demande qualifiée`

**Corps.**

> Bonjour {{recipient.first_name}},
>
> Votre demande **{{request.public_reference}}** a été qualifiée par notre équipe.
>
> Priorité retenue : **{{request.effective_priority_label}}**.
> {{#if request.priority_override_reason}}Motif d'ajustement : *{{request.priority_override_reason}}*.{{/if}}
>
> Elle est désormais en file d'affectation à un Responsable.
>
> [Suivre ma demande]({{request.url}})
>
> L'équipe TECHDIFRIK.

### A4.2.3 `COMPLEMENT_DEMANDE`

**Sujet.** `[MyTDFRIK] [{{request.public_reference}}] Complément demandé sur votre demande`

**Corps.**

> Bonjour {{recipient.first_name}},
>
> {{actor.full_name}} ({{actor.role_label}}) a sollicité un complément d'information sur votre demande **{{request.public_reference}}** :
>
> > {{action.message_body}}
>
> Pour répondre, rendez-vous sur la fiche :
>
> [Répondre]({{request.url}})
>
> Sans réponse de votre part, le traitement de votre demande sera temporairement suspendu.
>
> L'équipe TECHDIFRIK.

### A4.2.4 `DEMANDE_REJETEE`

**Sujet.** `[MyTDFRIK] [{{request.public_reference}}] Votre demande n'a pas pu être prise en charge`

**Corps.**

> Bonjour {{recipient.first_name}},
>
> Votre demande **{{request.public_reference}}** n'a pas pu être prise en charge.
>
> Motif : *{{action.summary}}*.
>
> Si vous estimez que cette décision mérite d'être réexaminée, vous pouvez créer une nouvelle demande en référençant celle-ci, ou contacter votre interlocuteur commercial habituel.
>
> [Consulter la demande]({{request.url}})
>
> L'équipe TECHDIFRIK.

### A4.2.5 `DEMANDE_AFFECTEE_CLIENT`

**Sujet.** `[MyTDFRIK] [{{request.public_reference}}] Votre demande a été affectée à {{actor.full_name}}`

**Corps.**

> Bonjour {{recipient.first_name}},
>
> Votre demande **{{request.public_reference}}** a été affectée à **{{actor.full_name}}** ({{actor.role_label}}), qui devient votre interlocuteur direct.
>
> [Suivre ma demande]({{request.url}})
>
> L'équipe TECHDIFRIK.

### A4.2.6 `DEMANDE_AFFECTEE_RESPONSABLE`

**Sujet.** `[MyTDFRIK] [{{request.public_reference}}] Nouvelle demande affectée — priorité {{request.effective_priority_label}}`

**Corps.**

> Bonjour {{recipient.first_name}},
>
> Une nouvelle demande vous a été affectée par {{actor.full_name}} :
>
> - **Référence** : {{request.public_reference}}
> - **Titre** : {{request.title}}
> - **Priorité** : {{request.effective_priority_label}}
> - **Échéance de prise en charge** : {{sla.first_response_due_at_local}}
> - **Échéance de résolution** : {{sla.resolution_due_at_local}}
>
> [Ouvrir la demande]({{request.url}})

### A4.2.7 `TRAITEMENT_DEMARRE`

**Sujet.** `[MyTDFRIK] [{{request.public_reference}}] Traitement démarré`

**Corps.**

> Bonjour {{recipient.first_name}},
>
> {{actor.full_name}} a commencé le traitement de votre demande **{{request.public_reference}}**. Vous serez informé(e) à chaque étape clé.
>
> [Suivre ma demande]({{request.url}})

### A4.2.8 `NOUVEAU_MESSAGE`

**Sujet.** `[MyTDFRIK] [{{request.public_reference}}] Nouveau message de {{actor.full_name}}`

**Corps.**

> Bonjour {{recipient.first_name}},
>
> {{actor.full_name}} ({{actor.role_label}}) a posté un message sur la demande **{{request.public_reference}}** :
>
> > {{action.message_body}}
>
> [Répondre dans MyTDFRIK]({{request.url}})

### A4.2.9 `RESOLUTION_PROPOSEE`

**Sujet.** `[MyTDFRIK] [{{request.public_reference}}] Résolution proposée — votre validation est attendue`

**Corps.**

> Bonjour {{recipient.first_name}},
>
> {{actor.full_name}} estime votre demande **{{request.public_reference}}** résolue :
>
> > {{action.summary}}
>
> Merci de bien vouloir confirmer la résolution sous **7 jours**. Sans réponse de votre part, la demande sera automatiquement clôturée.
>
> [Valider ou contester la résolution]({{request.url}})

### A4.2.10 `DEMANDE_CLOTUREE`

**Sujet.** `[MyTDFRIK] [{{request.public_reference}}] Demande clôturée — votre avis nous intéresse`

**Corps.**

> Bonjour {{recipient.first_name}},
>
> Votre demande **{{request.public_reference}}** est désormais clôturée. Merci pour votre confiance.
>
> Si vous le souhaitez, vous pouvez évaluer la qualité du traitement en quelques secondes :
>
> [Évaluer le traitement]({{request.url}}#evaluation)
>
> En cas de besoin ultérieur, vous pouvez réouvrir cette demande dans les 30 prochains jours, ou en créer une nouvelle.
>
> L'équipe TECHDIFRIK.

### A4.2.11 `DEMANDE_CLOTUREE_AUTO`

**Sujet.** `[MyTDFRIK] [{{request.public_reference}}] Demande clôturée automatiquement`

**Corps.**

> Bonjour {{recipient.first_name}},
>
> Faute de validation explicite de votre part dans les 7 jours, la demande **{{request.public_reference}}** a été clôturée automatiquement.
>
> Si le problème subsiste ou si la résolution proposée ne vous satisfait pas, vous pouvez **réouvrir la demande** dans les 30 prochains jours :
>
> [Réouvrir la demande]({{request.url}})
>
> L'équipe TECHDIFRIK.

### A4.2.12 `DEMANDE_REOUVERTE`

**Sujet.** `[MyTDFRIK] [{{request.public_reference}}] Demande réouverte`

**Corps.**

> Bonjour {{recipient.first_name}},
>
> La demande **{{request.public_reference}}** vient d'être réouverte par le client à votre attention.
>
> Motif de réouverture : *{{action.summary}}*.
>
> Sa priorité a été réhaussée automatiquement à **{{request.effective_priority_label}}**.
>
> [Ouvrir la demande]({{request.url}})

### A4.2.13 `EVALUATION_BASSE`

**Sujet.** `[MyTDFRIK] Évaluation basse sur la demande {{request.public_reference}}`

**Corps.**

> Bonjour {{recipient.first_name}},
>
> La demande **{{request.public_reference}}** vient d'être évaluée à **{{action.summary}}/5** par le client.
>
> Commentaire : *{{action.message_body}}*
>
> Une analyse qualité est suggérée.
>
> [Consulter la demande]({{request.url}})

### A4.2.14 `COMPTE_CREE_ACTIVATION`

**Sujet.** `[MyTDFRIK] Activez votre compte`

**Corps.**

> Bonjour {{recipient.first_name}},
>
> Un compte a été créé pour vous sur MyTDFRIK, la plateforme de gestion des demandes clients de TECHDIFRIK.
>
> Pour l'activer et définir votre mot de passe, cliquez sur le lien ci-dessous (valide pendant 72 heures) :
>
> [Activer mon compte]({{action.activation_url}})
>
> Si vous n'êtes pas à l'origine de cette demande, ignorez ce courriel.
>
> L'équipe TECHDIFRIK.

### A4.2.15 `MOT_DE_PASSE_REINITIALISATION_LIEN`

**Sujet.** `[MyTDFRIK] Réinitialisation de votre mot de passe`

**Corps.**

> Bonjour {{recipient.first_name}},
>
> Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous (valide 30 minutes) :
>
> [Réinitialiser mon mot de passe]({{action.reset_url}})
>
> Si vous n'êtes pas à l'origine de cette demande, ignorez ce courriel et signalez l'incident à votre administrateur.

### A4.2.16 `MOT_DE_PASSE_REINITIALISE_CONFIRMATION`

**Sujet.** `[MyTDFRIK] Votre mot de passe a été modifié`

**Corps.**

> Bonjour {{recipient.first_name}},
>
> Votre mot de passe MyTDFRIK a été modifié le {{action.changed_at_local}}.
>
> Si vous n'êtes pas à l'origine de cette opération, contactez immédiatement l'administrateur TECHDIFRIK.

### A4.2.17 `COMPTE_VERROUILLE`

**Sujet.** `[MyTDFRIK] Votre compte a été temporairement verrouillé`

**Corps.**

> Bonjour {{recipient.first_name}},
>
> Plusieurs tentatives de connexion infructueuses ont été détectées sur votre compte. Pour votre sécurité, il est temporairement verrouillé pendant 15 minutes.
>
> Si vous êtes à l'origine de ces tentatives, vous pourrez vous reconnecter à l'issue de ce délai. Vous pouvez également [demander une réinitialisation de votre mot de passe]({{action.reset_url}}).
>
> Si vous n'êtes pas à l'origine de ces tentatives, signalez l'incident à votre administrateur sans tarder.
