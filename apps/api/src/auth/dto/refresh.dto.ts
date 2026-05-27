import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    description: 'Refresh token opaque émis par /auth/login ou /auth/refresh',
  })
  @IsString()
  @MinLength(32)
  refresh_token!: string;
}
