import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

/** Stockage objet des pièces jointes (CDC §3.8). Driver configurable. */
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
