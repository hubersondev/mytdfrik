import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsObject, Max, Min } from 'class-validator';

export class UpsertDraftDto {
  @ApiProperty({
    description:
      'Payload partiel du formulaire — clé/valeur libre, validé seulement à la soumission finale',
  })
  @IsObject()
  payload!: Record<string, unknown>;

  @ApiProperty({
    minimum: 0,
    maximum: 10,
    description: 'Étape courante du formulaire',
  })
  @IsInt()
  @Min(0)
  @Max(10)
  step!: number;
}
