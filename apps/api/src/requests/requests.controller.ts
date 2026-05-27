import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { RoleCode } from '../database/entities';
import { DraftsService } from './drafts.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpsertDraftDto } from './dto/draft.dto';
import { ListRequestsQueryDto } from './dto/list-requests.dto';
import { RequestsService } from './requests.service';

@ApiTags('requests')
@ApiBearerAuth()
@Controller({ path: 'requests', version: '1' })
export class RequestsController {
  private readonly logger = new Logger(RequestsController.name);

  constructor(
    private readonly service: RequestsService,
    private readonly drafts: DraftsService,
  ) {}

  // -------------------- Demandes --------------------

  @Post()
  @Roles('CLIENT')
  @ApiOperation({ summary: 'Soumet une nouvelle demande (Client)' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRequestDto,
  ) {
    const created = await this.service.create(
      {
        id: user.id,
        roleId: user.roleId as RoleCode,
        organizationId: user.organizationId,
      },
      dto,
    );
    return created;
  }

  @Get()
  @ApiOperation({
    summary:
      'Liste paginée des demandes (Client : ses propres demandes ; rôles internes : toutes)',
  })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListRequestsQueryDto) {
    // Le paramètre `status` accepte soit un statut unique soit une liste
    // séparée par des virgules pour matcher les "buckets" affichés côté UI
    // (ex. "Ouvertes" = NOUVELLE,EN_ATTENTE_AFFECTATION,AFFECTEE,EN_COURS).
    const statusList = query.status
      ? query.status
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    return this.service.list(
      {
        id: user.id,
        roleId: user.roleId as RoleCode,
        organizationId: user.organizationId,
      },
      {
        cursor: query.cursor,
        limit: query.limit,
        status: statusList,
        sort: query.sort,
      },
    );
  }

  @Get('by-reference/:reference')
  @ApiOperation({ summary: 'Lookup par référence publique MTF-AAAAMMJJ-NNNN' })
  findByReference(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reference') reference: string,
  ) {
    return this.service.findByPublicReference(
      {
        id: user.id,
        roleId: user.roleId as RoleCode,
        organizationId: user.organizationId,
      },
      reference,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une demande" })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.findById(
      {
        id: user.id,
        roleId: user.roleId as RoleCode,
        organizationId: user.organizationId,
      },
      id,
    );
  }

  // -------------------- Brouillons (Client uniquement) --------------------

  @Get('drafts/mine')
  @Roles('CLIENT')
  @ApiOperation({ summary: 'Liste mes brouillons en cours' })
  listMyDrafts(@CurrentUser() user: AuthenticatedUser) {
    return this.drafts.listMine(user.id);
  }

  @Get('drafts/:id')
  @Roles('CLIENT')
  @ApiOperation({
    summary: "Détail d'un brouillon (Client propriétaire uniquement)",
  })
  getDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.drafts.getMine(user.id, id);
  }

  @Post('drafts')
  @Roles('CLIENT')
  @ApiOperation({ summary: 'Crée un brouillon' })
  createDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertDraftDto,
  ) {
    return this.drafts.create(user.id, dto);
  }

  @Put('drafts/:id')
  @Roles('CLIENT')
  @ApiOperation({
    summary: 'Met à jour un brouillon (sauvegarde inter-étapes)',
  })
  updateDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpsertDraftDto,
  ) {
    return this.drafts.update(user.id, id, dto);
  }

  @Delete('drafts/:id')
  @Roles('CLIENT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime un brouillon' })
  async deleteDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    await this.drafts.deleteMine(user.id, id);
  }
}
