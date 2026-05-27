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
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './dto/organization.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller({ path: 'organizations', version: '1' })
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Get()
  @Roles('ADMIN', 'GESTIONNAIRE')
  @ApiOperation({
    summary: 'Liste paginée des organisations (ADMIN, GESTIONNAIRE)',
  })
  list(@Query() pagination: CursorPaginationDto) {
    return this.service.list({
      cursor: pagination.cursor,
      limit: pagination.limit,
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'GESTIONNAIRE')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crée une organisation (ADMIN)' })
  create(@Body() dto: CreateOrganizationDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Met à jour une organisation (ADMIN)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désactive une organisation (soft-delete, ADMIN)' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.service.deactivate(id);
  }
}
