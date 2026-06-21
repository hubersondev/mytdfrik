import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PasswordResetRequestDto {
  @ApiProperty({ example: 'client@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class PasswordResetConfirmDto {
  @ApiProperty({ description: 'Jeton reçu par courriel' })
  @IsString()
  @MinLength(32)
  token!: string;

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
  new_password!: string;
}
