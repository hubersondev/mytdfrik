import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../database/entities/category.entity';
import { Product } from '../database/entities/product.entity';
import { Request } from '../database/entities/request.entity';
import { User } from '../database/entities/user.entity';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [TypeOrmModule.forFeature([Request, User, Product, Category])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
