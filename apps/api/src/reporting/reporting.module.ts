import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Evaluation,
  Request,
  RequestBugDetail,
  User,
} from '../database/entities';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

/** Tableaux de bord & indicateurs (CDC §3.11, M13). */
@Module({
  imports: [
    TypeOrmModule.forFeature([Request, Evaluation, RequestBugDetail, User]),
  ],
  controllers: [MetricsController],
  providers: [MetricsService],
})
export class ReportingModule {}
