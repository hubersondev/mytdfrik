import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Evaluation,
  Request,
  RequestBugDetail,
  User,
} from '../database/entities';

const ACTIVE_STATUSES = [
  'NOUVELLE',
  'EN_ATTENTE_AFFECTATION',
  'AFFECTEE',
  'EN_COURS',
  'EN_ATTENTE_CLIENT',
];
const ASSIGNED_STATUSES = ['AFFECTEE', 'EN_COURS', 'EN_ATTENTE_CLIENT'];

export interface OperationalMetrics {
  enCours: number;
  enAttenteClient: number;
  enRetardSla: number;
  aCloturer: number;
  chargeResponsables: Array<{
    userId: string;
    name: string;
    actives: number;
    resolues: number;
  }>;
}

export interface StrategicMetrics {
  from: string;
  to: string;
  volume: { recues: number; resolues: number; cloturees: number };
  delaisMoyens: {
    priseEnChargeMinutes: number | null;
    resolutionMinutes: number | null;
  };
  tauxSatisfaction: number | null;
  nbEvaluations: number;
  tauxReouverture: number | null;
  distributionParCategorie: Array<{
    code: string;
    label: string;
    count: number;
  }>;
  distributionParPriorite: Array<{ priorityId: string; count: number }>;
  bugsParProduit: Array<{
    code: string;
    label: string;
    total: number;
    reproduits: number;
  }>;
}

/**
 * Agrégations pour les tableaux de bord (CDC §3.11). Indicateurs calculés en
 * base via des requêtes d'agrégation. Visualisations graphiques différées V1.1
 * [EXG-03-102] ; le MVP livre des tableaux chiffrés + export CSV [EXG-03-101].
 */
@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(Request) private readonly requests: Repository<Request>,
    @InjectRepository(Evaluation)
    private readonly evaluations: Repository<Evaluation>,
    @InjectRepository(RequestBugDetail)
    private readonly bugs: Repository<RequestBugDetail>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  /** Compteurs opérationnels + charge par responsable (CDC §3.11.1). */
  async operational(): Promise<OperationalMetrics> {
    const base = () =>
      this.requests.createQueryBuilder('r').where('r.deleted_at IS NULL');

    const [enCours, enAttenteClient, aCloturer] = await Promise.all([
      base().andWhere('r.status = :s', { s: 'EN_COURS' }).getCount(),
      base().andWhere('r.status = :s', { s: 'EN_ATTENTE_CLIENT' }).getCount(),
      base().andWhere('r.status = :s', { s: 'RESOLUE' }).getCount(),
    ]);

    const enRetardSla = await base()
      .andWhere('r.status IN (:...st)', { st: ACTIVE_STATUSES })
      .andWhere('r.sla_due_resolution_at IS NOT NULL')
      .andWhere('r.sla_due_resolution_at < now()')
      .getCount();

    // Charge par responsable : demandes actives assignées + résolues.
    const activeRows = await this.requests
      .createQueryBuilder('r')
      .select('r.assigned_to_user_id', 'userId')
      .addSelect('COUNT(*)', 'count')
      .where('r.deleted_at IS NULL')
      .andWhere('r.assigned_to_user_id IS NOT NULL')
      .andWhere('r.status IN (:...st)', { st: ASSIGNED_STATUSES })
      .groupBy('r.assigned_to_user_id')
      .getRawMany<{ userId: string; count: string }>();

    const resolvedRows = await this.requests
      .createQueryBuilder('r')
      .select('r.assigned_to_user_id', 'userId')
      .addSelect('COUNT(*)', 'count')
      .where('r.deleted_at IS NULL')
      .andWhere('r.assigned_to_user_id IS NOT NULL')
      .andWhere('r.status IN (:...st)', { st: ['RESOLUE', 'CLOTUREE'] })
      .groupBy('r.assigned_to_user_id')
      .getRawMany<{ userId: string; count: string }>();

    const ids = new Set([
      ...activeRows.map((r) => r.userId),
      ...resolvedRows.map((r) => r.userId),
    ]);
    const users =
      ids.size > 0
        ? await this.users.find({
            where: [...ids].map((id) => ({ id })),
            select: { id: true, firstName: true, lastName: true },
          })
        : [];
    const nameOf = new Map(
      users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]),
    );
    const activeOf = new Map(
      activeRows.map((r) => [r.userId, Number(r.count)]),
    );
    const resolvedOf = new Map(
      resolvedRows.map((r) => [r.userId, Number(r.count)]),
    );

    const chargeResponsables = [...ids].map((userId) => ({
      userId,
      name: nameOf.get(userId) ?? '—',
      actives: activeOf.get(userId) ?? 0,
      resolues: resolvedOf.get(userId) ?? 0,
    }));
    chargeResponsables.sort((a, b) => b.actives - a.actives);

    return {
      enCours,
      enAttenteClient,
      enRetardSla,
      aCloturer,
      chargeResponsables,
    };
  }

  /** Indicateurs stratégiques sur une période (CDC §3.11.2 [EXG-03-100]). */
  async strategic(from: Date, to: Date): Promise<StrategicMetrics> {
    const fromIso = from.toISOString();
    const toIso = to.toISOString();
    const inPeriod = (col: string) => `${col} >= :from AND ${col} <= :to`;

    const recues = await this.requests
      .createQueryBuilder('r')
      .where('r.deleted_at IS NULL')
      .andWhere(inPeriod('r.created_at'), { from: fromIso, to: toIso })
      .getCount();

    const resolues = await this.requests
      .createQueryBuilder('r')
      .where('r.resolved_at IS NOT NULL')
      .andWhere(inPeriod('r.resolved_at'), { from: fromIso, to: toIso })
      .getCount();

    const cloturees = await this.requests
      .createQueryBuilder('r')
      .where('r.closed_at IS NOT NULL')
      .andWhere(inPeriod('r.closed_at'), { from: fromIso, to: toIso })
      .getCount();

    // Délais moyens (en minutes) via EXTRACT EPOCH.
    const priseEnCharge = await this.requests
      .createQueryBuilder('r')
      .select(
        'AVG(EXTRACT(EPOCH FROM (r.qualified_at - r.created_at)) / 60)',
        'avg',
      )
      .where('r.qualified_at IS NOT NULL')
      .andWhere(inPeriod('r.qualified_at'), { from: fromIso, to: toIso })
      .getRawOne<{ avg: string | null }>();

    const resolution = await this.requests
      .createQueryBuilder('r')
      .select(
        'AVG(EXTRACT(EPOCH FROM (r.resolved_at - r.created_at)) / 60)',
        'avg',
      )
      .where('r.resolved_at IS NOT NULL')
      .andWhere(inPeriod('r.resolved_at'), { from: fromIso, to: toIso })
      .getRawOne<{ avg: string | null }>();

    // Satisfaction (évaluations soumises dans la période).
    const satisfaction = await this.evaluations
      .createQueryBuilder('e')
      .select('AVG(e.score)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where(inPeriod('e.submitted_at'), { from: fromIso, to: toIso })
      .getRawOne<{ avg: string | null; count: string }>();

    // Taux de réouverture : demandes clôturées (période) ayant été rouvertes.
    const reouvertes = await this.requests
      .createQueryBuilder('r')
      .where('r.closed_at IS NOT NULL')
      .andWhere(inPeriod('r.closed_at'), { from: fromIso, to: toIso })
      .andWhere('r.reopen_count > 0')
      .getCount();

    const distributionParCategorie = await this.requests
      .createQueryBuilder('r')
      .leftJoin('r.category', 'c')
      .select('c.code', 'code')
      .addSelect('c.label', 'label')
      .addSelect('COUNT(*)', 'count')
      .where('r.deleted_at IS NULL')
      .andWhere(inPeriod('r.created_at'), { from: fromIso, to: toIso })
      .groupBy('c.code')
      .addGroupBy('c.label')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany<{ code: string; label: string; count: string }>();

    const distributionParPriorite = await this.requests
      .createQueryBuilder('r')
      .select('r.effective_priority_id', 'priorityId')
      .addSelect('COUNT(*)', 'count')
      .where('r.deleted_at IS NULL')
      .andWhere(inPeriod('r.created_at'), { from: fromIso, to: toIso })
      .groupBy('r.effective_priority_id')
      .orderBy('r.effective_priority_id', 'ASC')
      .getRawMany<{ priorityId: string; count: string }>();

    const bugsParProduit = await this.bugs
      .createQueryBuilder('b')
      .leftJoin('b.product', 'p')
      .leftJoin('b.request', 'r')
      .select('p.code', 'code')
      .addSelect('p.label', 'label')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        "COUNT(*) FILTER (WHERE b.is_reproduced = 'OUI')",
        'reproduits',
      )
      .where(inPeriod('r.created_at'), { from: fromIso, to: toIso })
      .groupBy('p.code')
      .addGroupBy('p.label')
      .orderBy('total', 'DESC')
      .getRawMany<{
        code: string;
        label: string;
        total: string;
        reproduits: string;
      }>();

    const round = (v: string | null | undefined): number | null =>
      v === null || v === undefined ? null : Math.round(Number(v));

    return {
      from: fromIso,
      to: toIso,
      volume: { recues, resolues, cloturees },
      delaisMoyens: {
        priseEnChargeMinutes: round(priseEnCharge?.avg),
        resolutionMinutes: round(resolution?.avg),
      },
      tauxSatisfaction:
        satisfaction?.avg != null
          ? Math.round(Number(satisfaction.avg) * 100) / 100
          : null,
      nbEvaluations: Number(satisfaction?.count ?? 0),
      tauxReouverture:
        cloturees > 0 ? Math.round((reouvertes / cloturees) * 1000) / 10 : null,
      distributionParCategorie: distributionParCategorie.map((d) => ({
        code: d.code,
        label: d.label,
        count: Number(d.count),
      })),
      distributionParPriorite: distributionParPriorite.map((d) => ({
        priorityId: d.priorityId,
        count: Number(d.count),
      })),
      bugsParProduit: bugsParProduit.map((d) => ({
        code: d.code,
        label: d.label,
        total: Number(d.total),
        reproduits: Number(d.reproduits),
      })),
    };
  }
}
