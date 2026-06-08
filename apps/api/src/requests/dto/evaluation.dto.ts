import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Max,
  Min,
} from 'class-validator';

/** Évaluation de satisfaction soumise par le Client à la clôture (CDC §8.4.12). */
export class SubmitEvaluationDto {
  @ApiProperty({
    minimum: 1,
    maximum: 5,
    description: 'Note de satisfaction (1-5)',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @ApiProperty({
    required: false,
    maxLength: 2000,
    description: 'Commentaire optionnel',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
