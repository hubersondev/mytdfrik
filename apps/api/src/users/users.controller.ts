import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/auth.service';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly service: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: "Profil de l'utilisateur courant" })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findById(user.id);
  }

  @Get()
  @Roles('ADMIN', 'GESTIONNAIRE')
  @ApiOperation({
    summary: 'Liste paginée des utilisateurs (ADMIN, GESTIONNAIRE)',
  })
  list(
    @Query() pagination: CursorPaginationDto,
    @Query('role') role?: string,
    @Query('organization_id') organizationId?: string,
  ) {
    return this.service.list({
      cursor: pagination.cursor,
      limit: pagination.limit,
      role,
      organizationId,
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'GESTIONNAIRE')
  @ApiOperation({ summary: "Détail d'un utilisateur (ADMIN, GESTIONNAIRE)" })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({
    summary: "Crée un utilisateur et émet un jeton d'activation (ADMIN)",
  })
  async create(@Body() dto: CreateUserDto) {
    const { user, activationToken } = await this.service.create(dto);
    // TODO S3 : envoyer le courriel SendGrid avec le gabarit COMPTE_CREE_ACTIVATION.
    this.logger.log(
      `[DEV] Jeton d'activation pour ${user.email} : ${activationToken} (à transmettre par courriel en S3)`,
    );
    return { user };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Met à jour un utilisateur (ADMIN)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.service.update(id, dto);
  }

  @Post(':id/deactivate')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Désactive un compte et révoque ses sessions (ADMIN)',
  })
  async deactivate(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.service.deactivate(id);
  }

  @Post(':id/reactivate')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Réactive un compte (ADMIN)' })
  async reactivate(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.service.reactivate(id);
  }

  @Post(':id/password-reset')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Émet un jeton de réinitialisation pour un compte (ADMIN)',
  })
  async forcePasswordReset(@Param('id', new ParseUUIDPipe()) id: string) {
    const { token } = await this.service.requestPasswordReset(id);
    // TODO S3 : envoyer le courriel SendGrid MOT_DE_PASSE_REINITIALISATION_LIEN.
    this.logger.log(
      `[DEV] Jeton de reset pour user ${id} : ${token} (à transmettre par courriel en S3)`,
    );
    return { sent: true };
  }
}
