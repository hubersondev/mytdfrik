import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Category,
  PriorityLevel,
  Request,
  RequestDraft,
  RequestMessage,
  RequestStateHistory,
  User,
} from '../database/entities';
import { DraftsService } from './drafts.service';
import { MessagesService } from './messages.service';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { TransitionsService } from './transitions.service';

/**
 * Module des demandes (CDC §3, §4, §5, §6, §9.4).
 *
 * - Sprint 3 : création par le Client, lecture par le propriétaire, brouillons.
 * - Sprint 4 : moteur de transitions (machine à états §4) + historique.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Request,
      RequestDraft,
      RequestMessage,
      RequestStateHistory,
      Category,
      PriorityLevel,
      User,
    ]),
  ],
  controllers: [RequestsController],
  providers: [
    RequestsService,
    DraftsService,
    TransitionsService,
    MessagesService,
  ],
  exports: [RequestsService, TransitionsService, MessagesService],
})
export class RequestsModule {}
