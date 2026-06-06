import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ROLE_SCOPES } from '../../database/entities';
import type { RoleScope } from '../../database/entities';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Code stable (slug MAJUSCULE), immuable après création',
    example: 'SUPPORT_N1',
  })
  @IsString()
  @Length(2, 20)
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message:
      'code doit être en MAJUSCULES, chiffres et underscores, commençant par une lettre.',
  })
  code!: string;

  @ApiProperty({ example: 'Support Niveau 1' })
  @IsString()
  @Length(2, 80)
  label!: string;

  @ApiProperty({ required: false, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @ApiProperty({ enum: ROLE_SCOPES, example: 'INTERNAL' })
  @IsIn(ROLE_SCOPES as readonly string[])
  scope!: RoleScope;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    required: false,
    type: [String],
    description: 'Codes de permissions du catalogue à attribuer',
    example: ['requests.qualify', 'users.read'],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissions?: string[];
}

/**
 * Champs modifiables d'un rôle. Le `code` et le `scope` sont immuables après
 * création : ils ne figurent pas ici.
 */
export class UpdateRoleFields {
  @ApiProperty({ required: false, example: 'Support Niveau 1' })
  @IsOptional()
  @IsString()
  @Length(2, 80)
  label?: string;

  @ApiProperty({ required: false, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissions?: string[];
}

export class UpdateRoleDto extends PartialType(UpdateRoleFields) {}
