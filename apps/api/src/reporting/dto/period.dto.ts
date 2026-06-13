import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

/** Plage temporelle des indicateurs stratégiques (défaut : 30 derniers jours). */
export class PeriodQueryDto {
  @ApiProperty({ required: false, description: 'Début (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({ required: false, description: 'Fin (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
