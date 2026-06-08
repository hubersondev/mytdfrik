import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { Request } from '../database/entities';
import {
  TransitionsService,
  type TransitionViewer,
} from './transitions.service';

/** Acteur système pour les transitions automatiques (T17). */
const SYSTEM_VIEWER: TransitionViewer = {
  id: '00000000-0000-0000-0000-000000000000',
  scope: 'INTERNAL',
  permissions: [],
  organizationId: null,
};

/**
 * Clôture automatique des demandes résolues non validées (CDC §4.3 T17,
 * §4.6 [EXG-04-031]). Un job horaire applique T17 sur toute demande restée en
 * RESOLUE au-delà du délai de validation (7 jours par défaut).
 */
@Injectable()
export class ExpirationService {
  private readonly logger = new Logger(ExpirationService.name);

  constructor(
    @InjectRepository(Request) private readonly requests: Repository<Request>,
    private readonly transitions: TransitionsService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR, { name: 'auto-close-resolved' })
  async handleCron(): Promise<number> {
    return this.closeExpiredResolved();
  }

  /**
   * Clôture les demandes RESOLUE dont le délai de validation est dépassé.
   * Exposé publiquement pour déclenchement manuel (tests / admin ultérieur).
   * Retourne le nombre de demandes clôturées.
   */
  async closeExpiredResolved(now: Date = new Date()): Promise<number> {
    const days = this.config.get<number>(
      'RESOLUTION_VALIDATION_EXPIRY_DAYS',
      7,
    );
    const threshold = new Date(now.getTime() - days * 86_400_000);

    const candidates = await this.requests.find({
      where: {
        status: 'RESOLUE',
        deletedAt: IsNull(),
        resolvedAt: LessThanOrEqual(threshold),
      },
      select: { id: true },
    });
    if (candidates.length === 0) return 0;

    let closed = 0;
    for (const { id } of candidates) {
      try {
        await this.transitions.apply(
          SYSTEM_VIEWER,
          id,
          'T17',
          { expectedStatus: 'RESOLUE' },
          { system: true },
        );
        closed += 1;
      } catch (error) {
        // Conflit de statut (la demande a évolué entre-temps) : on ignore.
        this.logger.warn(
          `Clôture auto ignorée pour ${id}: ${(error as Error).message}`,
        );
      }
    }
    if (closed > 0) {
      this.logger.log(
        `Clôture automatique de ${closed} demande(s) résolue(s).`,
      );
    }
    return closed;
  }
}
