import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Requête de recherche globale (topbar « ⌘K »). */
export class GlobalSearchQueryDto {
  @ApiPropertyOptional({
    description: 'Terme recherché (minimum 2 caractères significatifs)',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}
