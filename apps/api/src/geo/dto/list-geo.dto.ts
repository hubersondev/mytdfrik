import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { CursorPaginationDto } from '../../common/dto/pagination.dto';

/**
 * Query params de `GET /countries`. Étend la pagination commune avec le filtre
 * `active_only`. Les propriétés sont nommées comme les paramètres d'URL
 * (snake_case) pour passer la validation whitelist du ValidationPipe global.
 */
export class ListCountriesQueryDto extends CursorPaginationDto {
  @ApiProperty({
    required: false,
    description: 'Ne renvoyer que les pays actifs ("true")',
  })
  @IsOptional()
  @IsString()
  active_only?: string;
}

/**
 * Query params de `GET /cities`. Ajoute le filtre par pays (`country_id`) et
 * `active_only`.
 */
export class ListCitiesQueryDto extends CursorPaginationDto {
  @ApiProperty({
    required: false,
    format: 'uuid',
    description: 'Filtre par pays',
  })
  @IsOptional()
  @IsUUID()
  country_id?: string;

  @ApiProperty({
    required: false,
    description: 'Ne renvoyer que les villes actives ("true")',
  })
  @IsOptional()
  @IsString()
  active_only?: string;
}
