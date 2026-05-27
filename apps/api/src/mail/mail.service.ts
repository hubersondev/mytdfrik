import sgMail from '@sendgrid/mail';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { renderTemplate, type TemplateCode } from './templates';

export interface SendArgs {
  to: string;
  template: TemplateCode;
  variables: Record<string, string>;
}

/**
 * MailService — couche d'envoi unifiée pour les courriels transactionnels.
 *
 * Deux stratégies selon l'environnement :
 *   - **Prod / staging** : envoi via SendGrid (`@sendgrid/mail`) avec
 *     `SENDGRID_API_KEY` requis.
 *   - **Dev local** : si la clé est absente, on logue le contenu et on
 *     retourne SUCCESS. Aucun envoi réel. Permet de développer sans
 *     compte SendGrid.
 *
 * Les gabarits sont définis en TypeScript (cf. ./templates) pour bénéficier
 * du typage des variables. Une migration vers une table `notification_templates`
 * éditable par l'Admin est prévue en S8 (CDC §7.4.1, §8.4.13).
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private apiKey: string | null = null;
  private fromAddress!: string;
  private fromName!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.apiKey = this.config.get<string>('SENDGRID_API_KEY') ?? null;
    this.fromAddress = this.config.get<string>(
      'MAIL_FROM_ADDRESS',
      'notifications@techdifrik.com',
    );
    this.fromName = this.config.get<string>(
      'MAIL_FROM_NAME',
      'MyTDFRIK · TECHDIFRIK',
    );

    if (this.apiKey) {
      sgMail.setApiKey(this.apiKey);
      this.logger.log(
        `MailService prêt en mode SendGrid (from "${this.fromName}" <${this.fromAddress}>).`,
      );
    } else {
      this.logger.warn(
        `MailService en mode DEV (log only) — définissez SENDGRID_API_KEY pour activer l'envoi réel.`,
      );
    }
  }

  async send(args: SendArgs): Promise<void> {
    const rendered = renderTemplate(args.template, args.variables);

    if (!this.apiKey) {
      this.logger.log(
        `[MAIL DEV] → to=${args.to} template=${args.template}\n  sujet : ${rendered.subject}\n  variables : ${JSON.stringify(args.variables)}`,
      );
      return;
    }

    try {
      await sgMail.send({
        to: args.to,
        from: { email: this.fromAddress, name: this.fromName },
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
        trackingSettings: {
          clickTracking: { enable: false },
          openTracking: { enable: false },
        },
      });
      this.logger.log(`Email envoyé : ${args.template} → ${args.to}`);
    } catch (error) {
      this.logger.error(
        `Échec envoi email ${args.template} → ${args.to}`,
        error as Error,
      );
      // Best-effort : on ne casse pas le flux applicatif sur un échec d'envoi.
      // Sera retry via BullMQ + journal des deliveries au S8 (CDC §7.7).
    }
  }
}
