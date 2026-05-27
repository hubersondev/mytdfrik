import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category, PriorityLevel, Product } from '../database/entities';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { PriorityLevelsController } from './priority-levels.controller';
import { PriorityLevelsService } from './priority-levels.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Product, PriorityLevel])],
  controllers: [
    CategoriesController,
    ProductsController,
    PriorityLevelsController,
  ],
  providers: [CategoriesService, ProductsService, PriorityLevelsService],
  exports: [CategoriesService, ProductsService, PriorityLevelsService],
})
export class CatalogModule {}
