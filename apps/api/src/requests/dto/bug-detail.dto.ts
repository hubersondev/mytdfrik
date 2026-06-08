import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { IS_REPRODUCED_VALUES } from '../../database/entities';
import type { IsReproducedValue } from '../../database/entities';

/** Libellés de fréquence d'un bug récurrent (CDC §6.2.1). */
export const FREQUENCY_LABELS = [
  'À chaque utilisation',
  'Plusieurs fois par jour',
  'Plusieurs fois par semaine',
  'Occasionnel',
] as const;

/**
 * Détails d'un bug saisis par le Client (CDC §6.2.1). Joint à la création
 * d'une demande quand la catégorie porte `requires_bug_details = true`.
 *
 * Les champs `environmentOs` / `environmentBrowser` deviennent obligatoires
 * selon les métadonnées produit (`requires_os` / `requires_browser`,
 * [EXG-06-010]) — règle appliquée côté service. La cohérence
 * `isBlocking → impact` (BLOCAGE_*) est imposée au service ([EXG-06-020]).
 */
export class CreateBugDetailDto {
  @ApiProperty({ format: 'uuid', description: 'Produit/service concerné' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ maxLength: 60 })
  @IsString()
  @Length(1, 60)
  productVersion!: string;

  @ApiProperty({ maxLength: 2000, description: 'Comportement attendu' })
  @IsString()
  @Length(1, 2000)
  expectedBehavior!: string;

  @ApiProperty({ maxLength: 2000, description: 'Comportement observé' })
  @IsString()
  @Length(1, 2000)
  observedBehavior!: string;

  @ApiProperty({ maxLength: 3000, description: 'Étapes de reproduction' })
  @IsString()
  @Length(1, 3000)
  reproductionSteps!: string;

  @ApiProperty({ description: "Date/heure d'apparition (ISO 8601)" })
  @IsDateString()
  occurredAt!: string;

  @ApiProperty({ description: 'Le bug est-il récurrent ?' })
  @IsBoolean()
  isRecurrent!: boolean;

  @ApiProperty({
    required: false,
    enum: FREQUENCY_LABELS,
    description: 'Fréquence (obligatoire si récurrent — imposé au service)',
  })
  @IsOptional()
  @IsIn(FREQUENCY_LABELS as readonly string[])
  frequencyLabel?: string;

  @ApiProperty({ required: false, maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  environmentOs?: string;

  @ApiProperty({ required: false, maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  environmentBrowser?: string;

  @ApiProperty({ required: false, maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  environmentHardware?: string;

  @ApiProperty({ description: "Le bug bloque-t-il l'activité ?" })
  @IsBoolean()
  isBlocking!: boolean;

  @ApiProperty({ required: false, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  errorMessages?: string;
}

/**
 * Diagnostic du Responsable consigné avant la proposition de résolution
 * (CDC §6.3.2 [EXG-06-040], [EXG-06-050]).
 */
export class BugDiagnosticDto {
  @ApiProperty({ enum: IS_REPRODUCED_VALUES, description: 'Bug reproduit ?' })
  @IsIn(IS_REPRODUCED_VALUES as readonly string[])
  isReproduced!: IsReproducedValue;

  @ApiProperty({ maxLength: 3000, description: 'Cause identifiée' })
  @IsString()
  @Length(3, 3000)
  rootCause!: string;

  @ApiProperty({ maxLength: 3000, description: 'Action corrective' })
  @IsString()
  @Length(3, 3000)
  correctiveAction!: string;

  @ApiProperty({
    required: false,
    maxLength: 2000,
    description: 'Contournement',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  workaround?: string;

  @ApiProperty({ required: false, description: 'Correctif déployé ?' })
  @IsOptional()
  @IsBoolean()
  fixDeployed?: boolean;

  @ApiProperty({
    required: false,
    description: 'Résolution = contournement seul ?',
  })
  @IsOptional()
  @IsBoolean()
  workaroundOnly?: boolean;

  @ApiProperty({
    required: false,
    description: 'Éligible à la base de connaissances interne (différé MVP)',
  })
  @IsOptional()
  @IsBoolean()
  isKnowledgeBaseEligible?: boolean;
}
