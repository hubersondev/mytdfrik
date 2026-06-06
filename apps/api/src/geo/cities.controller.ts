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
import { CitiesService } from './cities.service';
import { CreateCityDto, UpdateCityDto } from './dto/city.dto';
import { ListCitiesQueryDto } from './dto/list-geo.dto';

@ApiTags('geo')
@ApiBearerAuth()
@Controller({ path: 'cities', version: '1' })
export class CitiesController {
  constructor(private readonly service: CitiesService) {}

  @Get()
  @ApiOperation({
    summary: 'Liste paginée des villes (filtrable par pays via country_id)',
  })
  list(@Query() query: ListCitiesQueryDto) {
    return this.service.list({
      cursor: query.cursor,
      limit: query.limit,
      countryId: query.country_id,
      activeOnly: query.active_only === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une ville" })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crée une ville (ADMIN)' })
  create(@Body() dto: CreateCityDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Met à jour une ville (ADMIN)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCityDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désactive une ville (soft-delete, ADMIN)' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.service.deactivate(id);
  }
}
