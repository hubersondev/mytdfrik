import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CursorPaginationDto } from '../../common/dto/pagination.dto';

/** Clés de tri admises côté API (alignées avec l'UI `SortMenu`). */
export const SORT_KEYS = [
  'activity_desc',
  'created_desc',
  'created_asc',
  'priority_asc',
] as const;
export type SortKey = (typeof SORT_KEYS)[number];

/**
 * Paramètres acceptés par `GET /requests` (CDC §9.4.3).
 * Étend la pagination commune avec deux filtres "produit" :
 *   - `status` : valeur unique ou liste CSV de statuts.
 *   - `sort`   : clé de tri (cf. SORT_KEYS) ; par défaut `activity_desc`.
 * Les valeurs inconnues sont ignorées silencieusement côté service.
 */
export class ListRequestsQueryDto extends CursorPaginationDto {
  @ApiProperty({
    required: false,
    description:
      'Statut(s) à filtrer. Valeur unique ou liste CSV. Les valeurs inconnues sont ignorées.',
    example: 'NOUVELLE,EN_COURS',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    required: false,
    enum: SORT_KEYS,
    description:
      'Ordre de tri. `activity_desc` (défaut, par activité récente), `created_desc`/`created_asc` (date de soumission), `priority_asc` (P0 → P4).',
  })
  @IsOptional()
  @IsEnum(SORT_KEYS)
  sort?: SortKey;

  @ApiProperty({
    required: false,
    description:
      "Filtre d'affectation : `me` = demandes affectées à l'utilisateur courant.",
  })
  @IsOptional()
  @IsString()
  assignee?: string;
}
