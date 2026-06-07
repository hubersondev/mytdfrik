import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import {
  PRIORITY_LEVEL_CODES,
  REQUEST_STATUS_VALUES,
} from '../../database/entities';
import type { PriorityLevelCode, RequestStatus } from '../../database/entities';

/**
 * Corps d'une transition `POST /requests/:id/transitions/:code` (CDC §4.4).
 *
 * `expectedStatus` est **obligatoire** : c'est le verrou optimiste applicatif
 * ([EXG-04-012]) — si le statut courant a changé entre-temps, l'API renvoie 409.
 */
export class ApplyTransitionDto {
  @ApiProperty({
    enum: REQUEST_STATUS_VALUES,
    description: 'Statut courant attendu (verrou optimiste).',
  })
  @IsIn(REQUEST_STATUS_VALUES as readonly string[])
  expectedStatus!: RequestStatus;

  @ApiProperty({
    required: false,
    maxLength: 2000,
    description: 'Motif / message / résumé selon la transition.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  note?: string;

  @ApiProperty({
    required: false,
    format: 'uuid',
    description: 'Responsable à affecter (transition T06).',
  })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiProperty({
    required: false,
    enum: PRIORITY_LEVEL_CODES,
    description:
      'Priorité ajustée lors de la qualification (T02) ; motif obligatoire.',
  })
  @IsOptional()
  @IsIn(PRIORITY_LEVEL_CODES as readonly string[])
  effectivePriorityId?: PriorityLevelCode;
}
