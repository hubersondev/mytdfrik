import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';

@ApiTags('catalog')
@ApiBearerAuth()
@Controller({ path: 'products', version: '1' })
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste paginée des produits' })
  list(
    @Query() pagination: CursorPaginationDto,
    @Query('active_only') activeOnly?: string,
  ) {
    return this.service.list({
      cursor: pagination.cursor,
      limit: pagination.limit,
      activeOnly: activeOnly === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un produit" })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @RequirePermissions('catalog.manage')
  @ApiOperation({ summary: 'Crée un produit (ADMIN)' })
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('catalog.manage')
  @ApiOperation({ summary: 'Met à jour un produit (ADMIN)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('catalog.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désactive un produit (soft-delete, ADMIN)' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.service.deactivate(id);
  }
}
