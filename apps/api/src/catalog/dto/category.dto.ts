import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { PRIORITY_LEVEL_CODES } from '../../database/entities';
import type { PriorityLevelCode } from '../../database/entities';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Identifiant stable (slug en MAJUSCULES_AVEC_UNDERSCORES)',
    example: 'PANNE',
  })
  @IsString()
  @Length(2, 40)
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message:
      'code doit être en MAJUSCULES, chiffres et underscores, commençant par une lettre.',
  })
  code!: string;

  @ApiProperty({ example: 'Panne ou indisponibilité' })
  @IsString()
  @Length(2, 120)
  label!: string;

  @ApiProperty({ required: false, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ enum: PRIORITY_LEVEL_CODES, example: 'P3' })
  @IsIn(PRIORITY_LEVEL_CODES as readonly string[])
  defaultPriorityId!: PriorityLevelCode;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  requiresBugDetails?: boolean;

  @ApiProperty({ required: false, maxLength: 80, example: 'Support technique' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  defaultResponsibleTeam?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    required: false,
    default: false,
    description: 'Réservée à certains clients (V2)',
  })
  @IsOptional()
  @IsBoolean()
  isReserved?: boolean;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
