import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** Changement de mot de passe par l'utilisateur connecté (CDC §10.2.1). */
export class ChangePasswordDto {
  @ApiProperty({ description: 'Mot de passe actuel' })
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @ApiProperty({
    minLength: 8,
    description:
      'Nouveau mot de passe — minimum 8 caractères, au moins 3 des 4 classes (CDC §10.2.1)',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(
    /^(?=(?:.*[a-z]){1})(?=(?:.*[A-Z]){1})(?=(?:.*\d){1})|(?=(?:.*[a-z]){1})(?=(?:.*[A-Z]){1})(?=(?:.*[^a-zA-Z0-9]){1})|(?=(?:.*[a-z]){1})(?=(?:.*\d){1})(?=(?:.*[^a-zA-Z0-9]){1})|(?=(?:.*[A-Z]){1})(?=(?:.*\d){1})(?=(?:.*[^a-zA-Z0-9]){1})/,
    {
      message:
        'Le mot de passe doit contenir au moins 3 des 4 classes : minuscules, majuscules, chiffres, caractères spéciaux.',
    },
  )
  newPassword!: string;
}
