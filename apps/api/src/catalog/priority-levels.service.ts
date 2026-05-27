import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriorityLevel } from '../database/entities';
import type { PriorityLevelCode } from '../database/entities';
import type { UpdatePriorityLevelDto } from './dto/priority-level.dto';

@Injectable()
export class PriorityLevelsService {
  constructor(
    @InjectRepository(PriorityLevel)
    private readonly repo: Repository<PriorityLevel>,
  ) {}

  async list(): Promise<PriorityLevel[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async findById(id: PriorityLevelCode): Promise<PriorityLevel> {
    const lvl = await this.repo.findOne({ where: { id } });
    if (!lvl) {
      throw new NotFoundException({ code: 'PRIORITY_LEVEL_NOT_FOUND' });
    }
    return lvl;
  }

  async update(
    id: PriorityLevelCode,
    dto: UpdatePriorityLevelDto,
  ): Promise<PriorityLevel> {
    const lvl = await this.findById(id);
    if (dto.label !== undefined) lvl.label = dto.label;
    if (dto.description !== undefined) lvl.description = dto.description;
    if (dto.slaFirstResponseMinutes !== undefined)
      lvl.slaFirstResponseMinutes = dto.slaFirstResponseMinutes;
    if (dto.slaResolutionMinutes !== undefined)
      lvl.slaResolutionMinutes = dto.slaResolutionMinutes;
    if (dto.is24x7 !== undefined) lvl.is24x7 = dto.is24x7;
    return this.repo.save(lvl);
  }
}
