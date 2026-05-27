/**
 * Gabarits transactionnels MyTDFRIK — version Sprint 3.
 *
 * Sprint 3 livre les 3 gabarits critiques du plan d'exécution :
 *   - ACCUSE_RECEPTION : confirme la création d'une demande
 *   - COMPTE_CREE_ACTIVATION : invite à activer un compte créé par l'Admin
 *   - MOT_DE_PASSE_REINITIALISATION_LIEN : invite à réinitialiser
 *
 * Les 14 gabarits restants (CDC §7.8 / annexe A4) arrivent au S8 quand le
 * système de notifications complet sera câblé. Les gabarits ici sont
 * stockés en code pour démarrer ; la migration vers la table éditable
 * `notification_templates` est planifiée au S8.
 *
 * Substitution de variables : `{{var}}` est remplacé par la valeur fournie.
 * Pas de logique conditionnelle pour rester simple (handlebars/ejs en S8).
 */

export const TEMPLATE_CODES = [
  'ACCUSE_RECEPTION',
  'COMPTE_CREE_ACTIVATION',
  'MOT_DE_PASSE_REINITIALISATION_LIEN',
] as const;
export type TemplateCode = (typeof TEMPLATE_CODES)[number];

interface TemplateDefinition {
  subject: string;
  text: string;
  html: string;
}

const COMMON_FOOTER_TEXT =
  '\n\nCet envoi est automatique — ne répondez pas à ce courriel.\nPour échanger avec votre interlocuteur, utilisez la messagerie intégrée à MyTDFRIK.\n\nTECHDIFRIK · Conformément au RGPD, vous pouvez exercer vos droits depuis votre espace personnel.';

const COMMON_FOOTER_HTML = `
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
  <p style="font-size: 12px; color: #6b7280; line-height: 1.5;">
    Cet envoi est automatique — ne répondez pas à ce courriel. Pour échanger avec votre interlocuteur, utilisez la messagerie intégrée à MyTDFRIK.
  </p>
  <p style="font-size: 12px; color: #6b7280; line-height: 1.5;">
    TECHDIFRIK · Conformément au RGPD, vous pouvez exercer vos droits depuis votre espace personnel.
  </p>
`;

const wrapHtml = (body: string): string => `
<!DOCTYPE html>
<html lang="fr">
  <body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #1f2937; max-width: 640px; margin: 0 auto;">
    <header style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">
      <strong style="color: #0d6e2a;">MyTDFRIK</strong> · TECHDIFRIK
    </header>
    <main style="padding: 24px;">
      ${body}
    </main>
    <footer style="padding: 0 24px 24px;">
      ${COMMON_FOOTER_HTML}
    </footer>
  </body>
</html>`;

const TEMPLATES: Record<TemplateCode, TemplateDefinition> = {
  ACCUSE_RECEPTION: {
    subject:
      '[MyTDFRIK] [{{public_reference}}] Votre demande a bien été enregistrée',
    text: `Bonjour {{first_name}},

Votre demande {{public_reference}} « {{title}} » a bien été enregistrée le {{created_at_local}}.

Elle est en statut "{{status_label}}" et a été classée en priorité {{priority_label}}.

Vous pouvez suivre l'avancement et échanger avec votre interlocuteur ici :
{{request_url}}
${COMMON_FOOTER_TEXT}

L'équipe TECHDIFRIK.`,
    html: wrapHtml(`
      <p>Bonjour <strong>{{first_name}}</strong>,</p>
      <p>Votre demande <strong>{{public_reference}}</strong> « {{title}} » a bien été enregistrée le {{created_at_local}}.</p>
      <p>Elle est en statut <strong>{{status_label}}</strong> et a été classée en priorité <strong>{{priority_label}}</strong>.</p>
      <p style="margin-top: 24px;">
        <a href="{{request_url}}" style="display: inline-block; background-color: #0d6e2a; color: #ffffff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 600;">Suivre ma demande</a>
      </p>
      <p style="color: #6b7280;">L'équipe TECHDIFRIK.</p>
    `),
  },

  COMPTE_CREE_ACTIVATION: {
    subject: '[MyTDFRIK] Activez votre compte',
    text: `Bonjour {{first_name}},

Un compte a été créé pour vous sur MyTDFRIK, la plateforme de gestion des demandes clients de TECHDIFRIK.

Pour l'activer et définir votre mot de passe, cliquez sur le lien ci-dessous (valide pendant 72 heures) :
{{activation_url}}

Si vous n'êtes pas à l'origine de cette demande, ignorez ce courriel.
${COMMON_FOOTER_TEXT}

L'équipe TECHDIFRIK.`,
    html: wrapHtml(`
      <p>Bonjour <strong>{{first_name}}</strong>,</p>
      <p>Un compte a été créé pour vous sur <strong>MyTDFRIK</strong>, la plateforme de gestion des demandes clients de TECHDIFRIK.</p>
      <p>Pour l'activer et définir votre mot de passe, cliquez sur le lien ci-dessous (valide pendant <strong>72 heures</strong>) :</p>
      <p style="margin-top: 24px;">
        <a href="{{activation_url}}" style="display: inline-block; background-color: #0d6e2a; color: #ffffff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 600;">Activer mon compte</a>
      </p>
      <p style="color: #6b7280;">Si vous n'êtes pas à l'origine de cette demande, ignorez ce courriel.</p>
      <p style="color: #6b7280;">L'équipe TECHDIFRIK.</p>
    `),
  },

  MOT_DE_PASSE_REINITIALISATION_LIEN: {
    subject: '[MyTDFRIK] Réinitialisation de votre mot de passe',
    text: `Bonjour {{first_name}},

Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous (valide 30 minutes) :
{{reset_url}}

Si vous n'êtes pas à l'origine de cette demande, ignorez ce courriel et signalez l'incident à votre administrateur.
${COMMON_FOOTER_TEXT}

L'équipe TECHDIFRIK.`,
    html: wrapHtml(`
      <p>Bonjour <strong>{{first_name}}</strong>,</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous (valide <strong>30 minutes</strong>) :</p>
      <p style="margin-top: 24px;">
        <a href="{{reset_url}}" style="display: inline-block; background-color: #0d6e2a; color: #ffffff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 600;">Réinitialiser mon mot de passe</a>
      </p>
      <p style="color: #6b7280;">Si vous n'êtes pas à l'origine de cette demande, ignorez ce courriel et signalez l'incident à votre administrateur.</p>
      <p style="color: #6b7280;">L'équipe TECHDIFRIK.</p>
    `),
  },
};

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

/**
 * Rend un gabarit en substituant les variables `{{var}}` dans subject/text/html.
 * Les variables manquantes sont remplacées par une chaîne vide pour éviter les
 * fuites de placeholders en clair dans les emails.
 */
export function renderTemplate(
  code: TemplateCode,
  variables: Record<string, string>,
): RenderedEmail {
  const template = TEMPLATES[code];
  const interpolate = (input: string): string =>
    input.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) =>
      typeof variables[key] === 'string' ? variables[key] : '',
    );
  return {
    subject: interpolate(template.subject),
    text: interpolate(template.text),
    html: interpolate(template.html),
  };
}
