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
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../auth/auth.service';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { MailService } from '../mail/mail.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly service: UsersService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  private webBaseUrl(): string {
    return this.config
      .get<string>('APP_WEB_BASE_URL', 'http://localhost:3001')
      .replace(/\/$/, '');
  }

  @Get('me')
  @ApiOperation({ summary: "Profil de l'utilisateur courant" })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findById(user.id);
  }

  @Get()
  @RequirePermissions('users.read')
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
  @RequirePermissions('users.read')
  @ApiOperation({ summary: "Détail d'un utilisateur (ADMIN, GESTIONNAIRE)" })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @RequirePermissions('users.manage')
  @ApiOperation({
    summary: "Crée un utilisateur et émet un jeton d'activation (ADMIN)",
  })
  async create(@Body() dto: CreateUserDto) {
    const { user, activationToken } = await this.service.create(dto);
    void this.mail
      .send({
        to: user.email,
        template: 'COMPTE_CREE_ACTIVATION',
        variables: {
          first_name: user.firstName,
          activation_url: `${this.webBaseUrl()}/activate?token=${encodeURIComponent(activationToken)}`,
        },
      })
      .catch((error) => {
        this.logger.error(
          `Échec envoi email d'activation pour ${user.email}`,
          error as Error,
        );
      });
    return { user };
  }

  @Patch(':id')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Met à jour un utilisateur (ADMIN)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.service.update(id, dto);
  }

  @Post(':id/deactivate')
  @RequirePermissions('users.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Désactive un compte et révoque ses sessions (ADMIN)',
  })
  async deactivate(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.service.deactivate(id);
  }

  @Post(':id/reactivate')
  @RequirePermissions('users.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Réactive un compte (ADMIN)' })
  async reactivate(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.service.reactivate(id);
  }

  @Post(':id/password-reset')
  @RequirePermissions('users.manage')
  @ApiOperation({
    summary: 'Émet un jeton de réinitialisation pour un compte (ADMIN)',
  })
  async forcePasswordReset(@Param('id', new ParseUUIDPipe()) id: string) {
    const target = await this.service.findById(id);
    const { token } = await this.service.requestPasswordReset(id);
    void this.mail
      .send({
        to: target.email,
        template: 'MOT_DE_PASSE_REINITIALISATION_LIEN',
        variables: {
          first_name: target.firstName,
          reset_url: `${this.webBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`,
        },
      })
      .catch((error) => {
        this.logger.error(
          `Échec envoi email de reset (admin) pour ${target.email}`,
          error as Error,
        );
      });
    return { sent: true };
  }
}
