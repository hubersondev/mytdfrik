import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ format: 'email' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 120)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 120)
  lastName!: string;

  @ApiProperty({
    description:
      'Code du rôle (dynamique). Son existence est validée par le service.',
    example: 'CLIENT',
  })
  @IsString()
  @Length(2, 20)
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'roleId doit être un code de rôle valide (MAJUSCULES).',
  })
  roleId!: string;

  @ApiProperty({
    required: false,
    description:
      'Obligatoire si le rôle est de portée CLIENT (validation métier dans le service)',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiProperty({ required: false, maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiProperty({
    required: false,
    default: 'Africa/Abidjan',
    description: 'Fuseau horaire IANA',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timeZone?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

/** Mise à jour par l'utilisateur de son propre profil (champs non sensibles). */
export class UpdateProfileDto {
  @ApiProperty({ minLength: 1, maxLength: 120 })
  @IsString()
  @Length(1, 120)
  firstName!: string;

  @ApiProperty({ minLength: 1, maxLength: 120 })
  @IsString()
  @Length(1, 120)
  lastName!: string;

  @ApiProperty({ required: false, maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiProperty({ required: false, maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timeZone?: string;
}
