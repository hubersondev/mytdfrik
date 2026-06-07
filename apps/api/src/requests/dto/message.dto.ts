import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Corps du message (Markdown limité).',
    maxLength: 5000,
  })
  @IsString()
  @Length(1, 5000)
  body!: string;

  @ApiProperty({
    required: false,
    default: false,
    description:
      'Message interne (Gestionnaire/Responsable), non visible du Client.',
  })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}

export class WithdrawMessageDto {
  @ApiProperty({ description: 'Motif du retrait.', maxLength: 300 })
  @IsString()
  @Length(3, 300)
  reason!: string;
}
