import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Identifiant stable (slug en MAJUSCULES)',
    example: 'TDFK_ONLINE',
  })
  @IsString()
  @Length(2, 40)
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message:
      'code doit être en MAJUSCULES, chiffres et underscores, commençant par une lettre.',
  })
  code!: string;

  @ApiProperty({ example: 'Portail TDFK Online' })
  @IsString()
  @Length(2, 160)
  label!: string;

  @ApiProperty({ required: false, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ required: false, maxLength: 80, example: 'Équipe Web' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  defaultOwnerTeam?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  requiresOs?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  requiresBrowser?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
