import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Category,
  PriorityLevel,
  Request,
  RequestAttachment,
  RequestDraft,
  RequestMessage,
  RequestStateHistory,
  User,
} from '../database/entities';
import { StorageModule } from '../storage/storage.module';
import { AttachmentsService } from './attachments.service';
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
 * - Sprint 5 : priorisation appliquée + SLA.
 * - Sprint 6 : messagerie + pièces jointes (§3.7, §3.8).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Request,
      RequestDraft,
      RequestMessage,
      RequestAttachment,
      RequestStateHistory,
      Category,
      PriorityLevel,
      User,
    ]),
    StorageModule,
  ],
  controllers: [RequestsController],
  providers: [
    RequestsService,
    DraftsService,
    TransitionsService,
    MessagesService,
    AttachmentsService,
  ],
  exports: [RequestsService, TransitionsService, MessagesService],
})
export class RequestsModule {}
