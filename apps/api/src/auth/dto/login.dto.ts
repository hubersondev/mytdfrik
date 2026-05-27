import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'client@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    example: 'ChangeMeImmediately!42',
    minLength: 12,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
