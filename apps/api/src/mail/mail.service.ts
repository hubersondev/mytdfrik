import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { Resend } from 'resend';
import { renderTemplate, type TemplateCode } from './templates';

export interface SendArgs {
  to: string;
  template: TemplateCode;
  variables: Record<string, string>;
}

type Transport = 'smtp' | 'resend' | 'dev';

/**
 * MailService — couche d'envoi unifiée pour les courriels transactionnels.
 *
 * Trois transports, choisis par ordre de priorité au démarrage :
 *   1. **SMTP** (`nodemailer`) si `SMTP_HOST` est défini — utilisé pour Mailpit
 *      en local (test sans envoi réel, visualisation sur http://localhost:8025)
 *      ou tout serveur SMTP.
 *   2. **Resend** (`resend`) si `RESEND_API_KEY` est défini — prod / staging.
 *   3. **DEV (log only)** sinon — aucun envoi, le contenu est logué.
 *
 * Les gabarits sont définis en TypeScript (cf. ./templates) pour bénéficier
 * du typage des variables. Une migration vers une table `notification_templates`
 * éditable par l'Admin est prévue en S8 (CDC §7.4.1, §8.4.13).
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transport: Transport = 'dev';
  private resend: Resend | null = null;
  private smtp: Transporter | null = null;
  private fromAddress!: string;
  private fromName!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const smtpHost = this.config.get<string>('SMTP_HOST') ?? null;
    const resendKey = this.config.get<string>('RESEND_API_KEY') ?? null;
    this.fromAddress = this.config.get<string>(
      'MAIL_FROM_ADDRESS',
      'onboarding@resend.dev',
    );
    this.fromName = this.config.get<string>(
      'MAIL_FROM_NAME',
      'MyTDFRIK · TECHDIFRIK',
    );

    if (smtpHost) {
      const port = this.config.get<number>('SMTP_PORT', 1025);
      const user = this.config.get<string>('SMTP_USER') ?? undefined;
      const pass = this.config.get<string>('SMTP_PASSWORD') ?? undefined;
      this.smtp = createTransport({
        host: smtpHost,
        port,
        // SMTP implicite (TLS) seulement sur 465 ; Mailpit (1025) est en clair.
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      });
      this.transport = 'smtp';
      this.logger.log(
        `MailService prêt en mode SMTP (${smtpHost}:${port}, from "${this.fromName}" <${this.fromAddress}>).`,
      );
    } else if (resendKey) {
      this.resend = new Resend(resendKey);
      this.transport = 'resend';
      this.logger.log(
        `MailService prêt en mode Resend (from "${this.fromName}" <${this.fromAddress}>).`,
      );
    } else {
      this.transport = 'dev';
      this.logger.warn(
        `MailService en mode DEV (log only) — définissez SMTP_HOST (Mailpit) ou RESEND_API_KEY pour activer l'envoi.`,
      );
    }
  }

  async send(args: SendArgs): Promise<void> {
    const rendered = renderTemplate(args.template, args.variables);
    const from = `${this.fromName} <${this.fromAddress}>`;

    try {
      if (this.transport === 'smtp' && this.smtp) {
        const info = (await this.smtp.sendMail({
          from,
          to: args.to,
          subject: rendered.subject,
          text: rendered.text,
          html: rendered.html,
        })) as { messageId?: string };
        this.logger.log(
          `Email envoyé (SMTP) : ${args.template} → ${args.to} (id=${info.messageId ?? '—'})`,
        );
        return;
      }

      if (this.transport === 'resend' && this.resend) {
        const { data, error } = await this.resend.emails.send({
          from,
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
          `Email envoyé (Resend) : ${args.template} → ${args.to} (id=${data?.id ?? '—'})`,
        );
        return;
      }

      // Mode DEV : aucun envoi, on logue le contenu.
      this.logger.log(
        `[MAIL DEV] → to=${args.to} template=${args.template}\n  sujet : ${rendered.subject}\n  variables : ${JSON.stringify(args.variables)}`,
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
