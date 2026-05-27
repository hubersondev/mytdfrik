import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category, Request, RequestDraft, User } from '../database/entities';
import { DraftsService } from './drafts.service';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

/**
 * Module des demandes (CDC §3, §4, §5, §6, §9.4).
 *
 * Sprint 3 livre : création par le Client + lecture par le propriétaire +
 * brouillons. Les transitions de la machine à états et la gestion par
 * les rôles internes arrivent au S4-S7.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Request, RequestDraft, Category, User])],
  controllers: [RequestsController],
  providers: [RequestsService, DraftsService],
  exports: [RequestsService],
})
export class RequestsModule {}
