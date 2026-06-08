import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class WithdrawAttachmentDto {
  @ApiProperty({
    description: 'Motif du retrait de la pièce jointe.',
    maxLength: 300,
  })
  @IsString()
  @Length(3, 300)
  reason!: string;
}
