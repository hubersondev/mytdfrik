import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { ROLE_CODES } from '../../database/entities';
import type { RoleCode } from '../../database/entities';

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

  @ApiProperty({ enum: ROLE_CODES })
  @IsIn(ROLE_CODES as readonly string[])
  roleId!: RoleCode;

  @ApiProperty({
    required: false,
    description:
      'Obligatoire si roleId = CLIENT (validation métier dans le service)',
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
