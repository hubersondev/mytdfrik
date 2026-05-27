import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { IMPACT_VALUES, URGENCY_VALUES } from '../../database/entities';
import type { ImpactValue, UrgencyValue } from '../../database/entities';

/**
 * Payload de création d'une demande par un Client (CDC §3.4, §5.2).
 *
 * Note : aucun champ `priority` n'est exposé — la priorité système est
 * calculée côté serveur via la matrice Impact × Urgence et la pondération
 * de catégorie (CDC §5.1 P1).
 */
export class CreateRequestDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Catégorie sélectionnée par le Client',
  })
  @IsUUID()
  categoryId!: string;

  @ApiProperty({
    minLength: 2,
    maxLength: 200,
    description: 'Titre court de la demande',
  })
  @IsString()
  @Length(2, 200)
  title!: string;

  @ApiProperty({
    minLength: 10,
    maxLength: 10000,
    description: 'Description détaillée',
  })
  @IsString()
  @Length(10, 10_000)
  description!: string;

  @ApiProperty({
    enum: IMPACT_VALUES,
    description: 'Impact métier déclaré (CDC §5.2.2)',
  })
  @IsIn(IMPACT_VALUES as readonly string[])
  impact!: ImpactValue;

  @ApiProperty({
    enum: URGENCY_VALUES,
    description: 'Urgence métier déclarée (CDC §5.2.3)',
  })
  @IsIn(URGENCY_VALUES as readonly string[])
  urgency!: UrgencyValue;

  @ApiProperty({
    required: false,
    maxLength: 500,
    description:
      'Contexte particulier libre — informationnel, ne participe pas au calcul priorité',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  clientContextNote?: string;
}
