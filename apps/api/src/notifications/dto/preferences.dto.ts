import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

/** Préférences de notification : { [catégorie]: { IN_APP: bool, EMAIL: bool } }. */
export class UpdatePreferencesDto {
  @ApiProperty({
    description:
      'Préférences par catégorie × canal. Ex. { "CLIENT_ACTIVITY": { "EMAIL": false } }',
  })
  @IsObject()
  preferences!: Record<string, Record<string, boolean>>;
}
