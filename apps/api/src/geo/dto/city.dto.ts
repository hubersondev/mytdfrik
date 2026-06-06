import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateCityDto {
  @ApiProperty({ description: 'Pays de rattachement', format: 'uuid' })
  @IsUUID()
  countryId!: string;

  @ApiProperty({ example: 'Abidjan' })
  @IsString()
  @Length(1, 120)
  name!: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCityDto extends PartialType(CreateCityDto) {}
