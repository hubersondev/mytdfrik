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
import { Roles } from '../auth/decorators/roles.decorator';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@ApiTags('catalog')
@ApiBearerAuth()
@Controller({ path: 'categories', version: '1' })
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste paginée des catégories' })
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
  @ApiOperation({ summary: "Détail d'une catégorie" })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crée une catégorie (ADMIN)' })
  create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Met à jour une catégorie (ADMIN)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désactive une catégorie (soft-delete, ADMIN)' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.service.deactivate(id);
  }
}
