import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../database/entities';
import type { RoleCode } from '../database/entities';

export interface AuditEntry {
  actorUserId: string | null;
  actorRole: RoleCode | null;
  actionCode: string;
  objectType: string;
  objectId: string | null;
  payload: Record<string, unknown> | null;
  clientIp: string | null;
  userAgent: string | null;
  requestIdCorrelation: string | null;
}

/**
 * Service d'écriture du journal d'audit (CDC §3.13, §10.6).
 * Append-only — aucune méthode de modification ou de suppression n'est exposée.
 */
@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private readonly repo: Repository<AuditLog>,
  ) {}

  async record(entry: AuditEntry): Promise<void> {
    const row = this.repo.create({
      actorUserId: entry.actorUserId,
      actorRole: entry.actorRole,
      actionCode: entry.actionCode,
      objectType: entry.objectType,
      objectId: entry.objectId,
      payload: entry.payload,
      clientIp: entry.clientIp,
      userAgent: entry.userAgent,
      requestIdCorrelation: entry.requestIdCorrelation,
    });
    await this.repo.save(row);
  }
}
