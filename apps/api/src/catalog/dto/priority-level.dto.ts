import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * DTO de mise à jour d'un niveau de priorité.
 * Seuls les SLA et libellés/descriptions sont modifiables — pas l'id (PK).
 *
 * Toute modification est journalisée et requiert validation préalable de la DG
 * (CDC §3.12 [EXG-03-111], §11.12.2).
 */
export class UpdatePriorityLevelDto {
  @ApiProperty({ required: false, minLength: 2, maxLength: 40 })
  @IsOptional()
  @IsString()
  @Length(2, 40)
  label?: string;

  @ApiProperty({ required: false, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    required: false,
    minimum: 1,
    description: 'Délai cible de prise en charge en minutes',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  slaFirstResponseMinutes?: number;

  @ApiProperty({
    required: false,
    minimum: 1,
    description: 'Délai cible de résolution en minutes',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  slaResolutionMinutes?: number;

  @ApiProperty({
    required: false,
    description:
      '24/7 — réservé en pratique à P0 au MVP (CDC §5.6.3 [EXG-05-071]).',
  })
  @IsOptional()
  @IsBoolean()
  is24x7?: boolean;
}
