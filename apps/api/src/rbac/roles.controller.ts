import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PERMISSION_CATALOG } from './permissions.catalog';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { RolesService } from './roles.service';

@ApiTags('rbac')
@ApiBearerAuth()
@Controller({ path: 'roles', version: '1' })
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  @RequirePermissions('roles.read')
  @ApiOperation({ summary: 'Liste des rôles (filtrable par scope)' })
  list(
    @Query('scope') scope?: string,
    @Query('active_only') activeOnly?: string,
  ) {
    return this.service.list({ scope, activeOnly: activeOnly === 'true' });
  }

  @Get(':id')
  @RequirePermissions('roles.read')
  @ApiOperation({ summary: "Détail d'un rôle" })
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @RequirePermissions('roles.manage')
  @ApiOperation({ summary: 'Crée un rôle' })
  create(@Body() dto: CreateRoleDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('roles.manage')
  @ApiOperation({
    summary: 'Met à jour un rôle (libellé, description, statut, permissions)',
  })
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('roles.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprime un rôle (soft-delete, hors rôle système)',
  })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }
}

@ApiTags('rbac')
@ApiBearerAuth()
@Controller({ path: 'permissions', version: '1' })
export class PermissionsController {
  @Get()
  @RequirePermissions('roles.read')
  @ApiOperation({
    summary: 'Catalogue des permissions disponibles (lecture seule)',
  })
  list() {
    return { items: PERMISSION_CATALOG };
  }
}
