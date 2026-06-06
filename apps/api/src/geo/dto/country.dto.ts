import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateCountryDto {
  @ApiProperty({
    description: 'Code ISO 3166-1 alpha-2 en MAJUSCULES',
    example: 'CI',
  })
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/, {
    message: 'code doit être 2 lettres majuscules (ISO 3166-1 alpha-2).',
  })
  code!: string;

  @ApiProperty({ example: "Côte d'Ivoire" })
  @IsString()
  @Length(2, 80)
  name!: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCountryDto extends PartialType(CreateCountryDto) {}
