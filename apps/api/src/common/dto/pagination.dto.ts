import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Pagination commune (CDC §9.2.3) — curseur opaque + limite bornée.
 *
 * Implémentation : le curseur est un objet base64url JSON `{ id, createdAt }`.
 * Le service de pagination est dans `cursor.util.ts`.
 */
export class CursorPaginationDto {
  @ApiProperty({
    required: false,
    description: 'Curseur opaque renvoyé par la précédente page',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiProperty({
    required: false,
    description: "Nombre maximum d'éléments renvoyés (1 à 100, défaut 25)",
    minimum: 1,
    maximum: 100,
    default: 25,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;
}

export interface PageInfo {
  next_cursor: string | null;
  has_next: boolean;
}

export interface CursorPage<T> {
  items: T[];
  page_info: PageInfo;
}
