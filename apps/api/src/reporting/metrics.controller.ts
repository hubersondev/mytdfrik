import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PeriodQueryDto } from './dto/period.dto';
import { MetricsService, type StrategicMetrics } from './metrics.service';

const DEFAULT_WINDOW_MS = 30 * 86_400_000; // 30 jours

@ApiTags('metrics')
@ApiBearerAuth()
@Controller({ path: 'metrics', version: '1' })
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('operational')
  @RequirePermissions('requests.read.all')
  @ApiOperation({ summary: 'Compteurs opérationnels + charge par responsable' })
  operational() {
    return this.metrics.operational();
  }

  @Get('strategic')
  @RequirePermissions('requests.read.all')
  @ApiOperation({ summary: 'Indicateurs stratégiques sur une période' })
  strategic(@Query() q: PeriodQueryDto) {
    const { from, to } = this.resolvePeriod(q);
    return this.metrics.strategic(from, to);
  }

  @Get('strategic.csv')
  @RequirePermissions('requests.read.all')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header(
    'Content-Disposition',
    'attachment; filename="indicateurs-mytdfrik.csv"',
  )
  @ApiOperation({
    summary: 'Export CSV des indicateurs stratégiques [EXG-03-101]',
  })
  async strategicCsv(@Query() q: PeriodQueryDto): Promise<string> {
    const { from, to } = this.resolvePeriod(q);
    const m = await this.metrics.strategic(from, to);
    return this.toCsv(m);
  }

  private resolvePeriod(q: PeriodQueryDto): { from: Date; to: Date } {
    const to = q.to ? new Date(q.to) : new Date();
    const from = q.from
      ? new Date(q.from)
      : new Date(to.getTime() - DEFAULT_WINDOW_MS);
    return { from, to };
  }

  /** Sérialise les indicateurs en CSV (sections empilées, séparateur « ; »). */
  private toCsv(m: StrategicMetrics): string {
    const lines: string[] = [];
    const esc = (v: string | number | null): string => {
      const s = v === null ? '' : String(v);
      return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const row = (...cols: Array<string | number | null>) =>
      lines.push(cols.map(esc).join(';'));

    row('Période début', m.from);
    row('Période fin', m.to);
    row('');
    row('Indicateur', 'Valeur');
    row('Demandes reçues', m.volume.recues);
    row('Demandes résolues', m.volume.resolues);
    row('Demandes clôturées', m.volume.cloturees);
    row(
      'Délai moyen prise en charge (min)',
      m.delaisMoyens.priseEnChargeMinutes,
    );
    row('Délai moyen résolution (min)', m.delaisMoyens.resolutionMinutes);
    row('Satisfaction moyenne (/5)', m.tauxSatisfaction);
    row('Nombre d’évaluations', m.nbEvaluations);
    row('Taux de réouverture (%)', m.tauxReouverture);
    row('');
    row('Catégorie', 'Code', 'Nombre');
    for (const c of m.distributionParCategorie) row(c.label, c.code, c.count);
    row('');
    row('Priorité', 'Nombre');
    for (const p of m.distributionParPriorite) row(p.priorityId, p.count);
    row('');
    row('Produit (bugs)', 'Code', 'Total', 'Reproduits');
    for (const b of m.bugsParProduit)
      row(b.label, b.code, b.total, b.reproduits);

    return lines.join('\n');
  }
}
