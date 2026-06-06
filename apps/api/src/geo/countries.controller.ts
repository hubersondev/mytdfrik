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
import { CountriesService } from './countries.service';
import { CreateCountryDto, UpdateCountryDto } from './dto/country.dto';
import { ListCountriesQueryDto } from './dto/list-geo.dto';

@ApiTags('geo')
@ApiBearerAuth()
@Controller({ path: 'countries', version: '1' })
export class CountriesController {
  constructor(private readonly service: CountriesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste paginée des pays' })
  list(@Query() query: ListCountriesQueryDto) {
    return this.service.list({
      cursor: query.cursor,
      limit: query.limit,
      activeOnly: query.active_only === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un pays" })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @RequirePermissions('geo.manage')
  @ApiOperation({ summary: 'Crée un pays (ADMIN)' })
  create(@Body() dto: CreateCountryDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('geo.manage')
  @ApiOperation({ summary: 'Met à jour un pays (ADMIN)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCountryDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('geo.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désactive un pays (soft-delete, ADMIN)' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.service.deactivate(id);
  }
}
