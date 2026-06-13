import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { MailService } from '../mail/mail.service';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ActivateDto } from './dto/activate.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import {
  PasswordResetConfirmDto,
  PasswordResetRequestDto,
} from './dto/password-reset.dto';
import { RefreshDto } from './dto/refresh.dto';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly auth: AuthService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } }) // CDC §9.10
  @ApiOperation({
    summary: 'Authentifie un utilisateur par email + mot de passe',
  })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const result = await this.auth.login(dto.email, dto.password, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return {
      access_token: result.accessToken,
      token_type: 'Bearer',
      expires_in: result.expiresInSeconds,
      refresh_token: result.refreshToken,
      user: result.user,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Échange un refresh token contre un nouveau couple',
  })
  async refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    const result = await this.auth.refresh(dto.refresh_token, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return {
      access_token: result.accessToken,
      token_type: 'Bearer',
      expires_in: result.expiresInSeconds,
      refresh_token: result.refreshToken,
      user: result.user,
    };
  }

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Révoque la session courante (refresh token fourni)',
  })
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.auth.logout(dto.refresh_token);
  }

  @Post('logout-all')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Révoque toutes les sessions de l'utilisateur courant",
  })
  async logoutAll(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.auth.logoutAll(user.id);
  }

  @Post('change-password')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Change le mot de passe de l’utilisateur connecté (mot de passe actuel requis)',
  })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.auth.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Public()
  @Post('password-reset/request')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @ApiOperation({
    summary:
      'Envoie un courriel de réinitialisation. Toujours 204 pour anti-énumération.',
  })
  async requestPasswordReset(
    @Body() dto: PasswordResetRequestDto,
  ): Promise<void> {
    const result = await this.auth.requestPasswordReset(dto.email);
    if (result) {
      const baseUrl = this.config
        .get<string>('APP_WEB_BASE_URL', 'http://localhost:3001')
        .replace(/\/$/, '');
      void this.mail
        .send({
          to: result.email,
          template: 'MOT_DE_PASSE_REINITIALISATION_LIEN',
          variables: {
            first_name: result.firstName,
            reset_url: `${baseUrl}/reset-password?token=${encodeURIComponent(result.token)}`,
          },
        })
        .catch((error) => {
          this.logger.error(
            `Échec envoi email de réinitialisation pour ${result.email}`,
            error as Error,
          );
        });
    }
  }

  @Public()
  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 10, ttl: 15 * 60 * 1000 } })
  @ApiOperation({
    summary:
      'Définit le nouveau mot de passe à partir du jeton de réinitialisation',
  })
  async confirmPasswordReset(
    @Body() dto: PasswordResetConfirmDto,
  ): Promise<void> {
    await this.auth.confirmPasswordReset(dto.token, dto.new_password);
  }

  @Public()
  @Post('activate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 10, ttl: 15 * 60 * 1000 } })
  @ApiOperation({ summary: "Active un compte créé par l'Administrateur" })
  async activate(@Body() dto: ActivateDto): Promise<void> {
    await this.auth.activateAccount(dto.token, dto.password);
  }
}
