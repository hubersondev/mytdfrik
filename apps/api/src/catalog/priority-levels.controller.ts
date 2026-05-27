import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { PRIORITY_LEVEL_CODES } from '../database/entities';
import type { PriorityLevelCode } from '../database/entities';
import { UpdatePriorityLevelDto } from './dto/priority-level.dto';
import { PriorityLevelsService } from './priority-levels.service';

@ApiTags('catalog')
@ApiBearerAuth()
@Controller({ path: 'priority-levels', version: '1' })
export class PriorityLevelsController {
  constructor(private readonly service: PriorityLevelsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste les 5 niveaux de priorité avec SLA' })
  list() {
    return this.service.list();
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un niveau de priorité" })
  findOne(@Param('id') id: string) {
    return this.service.findById(this.assertPriorityCode(id));
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary:
      "Met à jour les SLA d'un niveau de priorité (ADMIN, sur validation DG)",
  })
  update(@Param('id') id: string, @Body() dto: UpdatePriorityLevelDto) {
    return this.service.update(this.assertPriorityCode(id), dto);
  }

  private assertPriorityCode(id: string): PriorityLevelCode {
    if (!(PRIORITY_LEVEL_CODES as readonly string[]).includes(id)) {
      throw new Error(`Priorité ${id} inconnue (attendu : P0-P4)`);
    }
    return id as PriorityLevelCode;
  }
}
