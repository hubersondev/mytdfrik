import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
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
 *   - **Prod / staging** : envoi via Resend (`resend`) avec `RESEND_API_KEY`
 *     requis. L'adresse `MAIL_FROM_ADDRESS` doit appartenir à un domaine
 *     vérifié dans Resend (ou `onboarding@resend.dev` en test, qui ne livre
 *     qu'à l'adresse du compte Resend).
 *   - **Dev local** : si la clé est absente, on logue le contenu et on
 *     retourne SUCCESS. Aucun envoi réel. Permet de développer sans compte.
 *
 * Les gabarits sont définis en TypeScript (cf. ./templates) pour bénéficier
 * du typage des variables. Une migration vers une table `notification_templates`
 * éditable par l'Admin est prévue en S8 (CDC §7.4.1, §8.4.13).
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;
  private fromAddress!: string;
  private fromName!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const apiKey = this.config.get<string>('RESEND_API_KEY') ?? null;
    this.fromAddress = this.config.get<string>(
      'MAIL_FROM_ADDRESS',
      'onboarding@resend.dev',
    );
    this.fromName = this.config.get<string>(
      'MAIL_FROM_NAME',
      'MyTDFRIK · TECHDIFRIK',
    );

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log(
        `MailService prêt en mode Resend (from "${this.fromName}" <${this.fromAddress}>).`,
      );
    } else {
      this.logger.warn(
        `MailService en mode DEV (log only) — définissez RESEND_API_KEY pour activer l'envoi réel.`,
      );
    }
  }

  async send(args: SendArgs): Promise<void> {
    const rendered = renderTemplate(args.template, args.variables);

    if (!this.resend) {
      this.logger.log(
        `[MAIL DEV] → to=${args.to} template=${args.template}\n  sujet : ${rendered.subject}\n  variables : ${JSON.stringify(args.variables)}`,
      );
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromAddress}>`,
        to: [args.to],
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
      });
      if (error) {
        // Resend retourne l'erreur dans la réponse (ne lève pas).
        this.logger.error(
          `Échec envoi email ${args.template} → ${args.to} : ${error.name} — ${error.message}`,
        );
        return;
      }
      this.logger.log(
        `Email envoyé : ${args.template} → ${args.to} (id=${data?.id ?? '—'})`,
      );
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
