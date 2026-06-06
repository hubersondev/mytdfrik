import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: "ACME Côte d'Ivoire" })
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiProperty({ required: false, maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  externalReference?: string;

  @ApiProperty({ required: false, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine?: string;

  @ApiProperty({
    required: false,
    format: 'uuid',
    description: 'Pays de référence (table countries)',
  })
  @IsOptional()
  @IsUUID()
  countryId?: string;

  @ApiProperty({
    required: false,
    format: 'uuid',
    description: 'Ville de référence (table cities)',
  })
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @ApiProperty({ required: false, format: 'email' })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  primaryContactEmail?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {}
