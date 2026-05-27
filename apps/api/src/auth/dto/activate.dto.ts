import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ActivateDto {
  @ApiProperty({ description: "Jeton d'activation reçu par courriel" })
  @IsString()
  @MinLength(32)
  token!: string;

  @ApiProperty({
    minLength: 12,
    description: 'Premier mot de passe — politique identique à reset',
  })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Matches(
    /^(?=(?:.*[a-z]){1})(?=(?:.*[A-Z]){1})(?=(?:.*\d){1})|(?=(?:.*[a-z]){1})(?=(?:.*[A-Z]){1})(?=(?:.*[^a-zA-Z0-9]){1})|(?=(?:.*[a-z]){1})(?=(?:.*\d){1})(?=(?:.*[^a-zA-Z0-9]){1})|(?=(?:.*[A-Z]){1})(?=(?:.*\d){1})(?=(?:.*[^a-zA-Z0-9]){1})/,
    {
      message:
        'Le mot de passe doit contenir au moins 3 des 4 classes : minuscules, majuscules, chiffres, caractères spéciaux.',
    },
  )
  password!: string;
}
