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
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import {
  AttachmentsService,
  type UploadedFileLike,
} from './attachments.service';
import { ApplyTransitionDto } from './dto/apply-transition.dto';
import { DraftsService } from './drafts.service';
import { WithdrawAttachmentDto } from './dto/attachment.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpsertDraftDto } from './dto/draft.dto';
import { ListRequestsQueryDto } from './dto/list-requests.dto';
import { CreateMessageDto, WithdrawMessageDto } from './dto/message.dto';
import { MessagesService } from './messages.service';
import { RequestsService } from './requests.service';
import {
  TransitionsService,
  type TransitionViewer,
} from './transitions.service';

// Garde-fou Multer (le service applique la limite précise et le message clair).
const MULTER_MAX_BYTES = 26_214_400; // 25 Mio

@ApiTags('requests')
@ApiBearerAuth()
@Controller({ path: 'requests', version: '1' })
export class RequestsController {
  private readonly logger = new Logger(RequestsController.name);

  constructor(
    private readonly service: RequestsService,
    private readonly drafts: DraftsService,
    private readonly transitions: TransitionsService,
    private readonly messages: MessagesService,
    private readonly attachments: AttachmentsService,
  ) {}

  private viewer(user: AuthenticatedUser): TransitionViewer {
    return {
      id: user.id,
      scope: user.scope,
      permissions: user.permissions,
      organizationId: user.organizationId,
    };
  }

  // -------------------- Demandes --------------------

  @Post()
  @RequirePermissions('requests.create')
  @ApiOperation({ summary: 'Soumet une nouvelle demande (Client)' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRequestDto,
  ) {
    const created = await this.service.create(
      {
        id: user.id,
        scope: user.scope,
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
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListRequestsQueryDto,
  ) {
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
        scope: user.scope,
        organizationId: user.organizationId,
      },
      {
        cursor: query.cursor,
        limit: query.limit,
        status: statusList,
        sort: query.sort,
        assignedToMe: query.assignee === 'me',
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
        scope: user.scope,
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
        scope: user.scope,
        organizationId: user.organizationId,
      },
      id,
    );
  }

  // -------------------- Cycle de vie (CDC §4) --------------------

  @Get(':id/transitions')
  @ApiOperation({
    summary: 'Transitions applicables par l’utilisateur courant',
  })
  availableTransitions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.transitions.availableTransitions(this.viewer(user), id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: "Historique des transitions d'une demande" })
  history(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.transitions.listHistory(this.viewer(user), id);
  }

  @Post(':id/transitions/:code')
  @ApiOperation({
    summary:
      'Applique une transition (moteur d’états ; 409 sur conflit, 403 si non autorisé)',
  })
  applyTransition(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('code') code: string,
    @Body() dto: ApplyTransitionDto,
  ) {
    return this.transitions.apply(this.viewer(user), id, code, dto);
  }

  // -------------------- Messagerie (CDC §3.7) --------------------

  @Get(':id/messages')
  @ApiOperation({
    summary: "Messages d'une demande (internes masqués au Client)",
  })
  listMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.messages.list(this.viewer(user), id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Publie un message sur une demande' })
  postMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messages.create(this.viewer(user), id, dto);
  }

  @Post('messages/:messageId/withdraw')
  @ApiOperation({
    summary: 'Retire un message (auteur uniquement, motif requis)',
  })
  withdrawMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('messageId', new ParseUUIDPipe()) messageId: string,
    @Body() dto: WithdrawMessageDto,
  ) {
    return this.messages.withdraw(this.viewer(user), messageId, dto);
  }

  // -------------------- Pièces jointes (CDC §3.8) --------------------

  // NB : la route publique de téléchargement doit précéder ':id/...' pour ne
  // pas être capturée comme un identifiant de demande.
  @Get('attachments/download')
  @Public()
  @ApiOperation({
    summary: 'Télécharge une pièce jointe via une URL signée et expirante',
  })
  async downloadAttachment(
    @Query('id') id: string,
    @Query('exp') exp: string,
    @Query('sig') sig: string,
    @Res() res: Response,
  ): Promise<void> {
    const payload = await this.attachments.resolveSignedDownload(
      id,
      Number(exp),
      sig,
    );
    res.setHeader('Content-Type', payload.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(payload.filename)}"`,
    );
    res.send(payload.buffer);
  }

  @Get(':id/attachments')
  @ApiOperation({ summary: "Pièces jointes d'une demande" })
  listAttachments(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.attachments.list(this.viewer(user), id);
  }

  @Post(':id/attachments')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MULTER_MAX_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Téléverse une pièce jointe sur une demande' })
  uploadAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: UploadedFileLike | undefined,
  ) {
    return this.attachments.upload(this.viewer(user), id, file);
  }

  @Post('attachments/:attachmentId/withdraw')
  @ApiOperation({
    summary: 'Retire une pièce jointe (auteur uniquement, motif requis)',
  })
  withdrawAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attachmentId', new ParseUUIDPipe()) attachmentId: string,
    @Body() dto: WithdrawAttachmentDto,
  ) {
    return this.attachments.withdraw(this.viewer(user), attachmentId, dto);
  }

  // -------------------- Brouillons (Client uniquement) --------------------

  @Get('drafts/mine')
  @RequirePermissions('requests.create')
  @ApiOperation({ summary: 'Liste mes brouillons en cours' })
  listMyDrafts(@CurrentUser() user: AuthenticatedUser) {
    return this.drafts.listMine(user.id);
  }

  @Get('drafts/:id')
  @RequirePermissions('requests.create')
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
  @RequirePermissions('requests.create')
  @ApiOperation({ summary: 'Crée un brouillon' })
  createDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertDraftDto,
  ) {
    return this.drafts.create(user.id, dto);
  }

  @Put('drafts/:id')
  @RequirePermissions('requests.create')
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
  @RequirePermissions('requests.create')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime un brouillon' })
  async deleteDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    await this.drafts.deleteMine(user.id, id);
  }
}
