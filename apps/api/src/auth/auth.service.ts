import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { MoreThan, Repository } from 'typeorm';
import {
  AccountActivationToken,
  PasswordResetToken,
  Session,
  User,
} from '../database/entities';
import { generateOpaqueToken, hashToken } from './token-hash.util';

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  organizationId: string | null;
  timeZone: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: AuthenticatedUser;
}

interface SessionContext {
  ip?: string;
  userAgent?: string;
}

/**
 * AuthService — coeur de l'authentification (CDC §10.2, §9.3).
 *
 * Responsabilités :
 * - Validation du couple email/password avec bcrypt cost 12.
 * - Émission de paires JWT (15 min) + refresh token opaque (7j, rotatif).
 * - Verrouillage temporaire après 5 échecs consécutifs.
 * - Détection de réutilisation de refresh token → révocation totale.
 * - Réinitialisation de mot de passe via lien à usage unique.
 * - Activation de compte via lien initial.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokens: Repository<PasswordResetToken>,
    @InjectRepository(AccountActivationToken)
    private readonly activationTokens: Repository<AccountActivationToken>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // -------------------------- Login --------------------------

  async login(
    email: string,
    password: string,
    context: SessionContext,
  ): Promise<TokenPair> {
    const user = await this.findUserByEmail(email);
    if (!user || !user.isActive || user.deletedAt) {
      // Réponse uniforme pour empêcher l'énumération (CDC §10.2.1 [EXG-09-044])
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Identifiants invalides.',
      });
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_LOCKED',
        message: 'Compte temporairement verrouillé. Réessayez plus tard.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await this.recordFailedLogin(user);
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Identifiants invalides.',
      });
    }

    // Succès — reset compteur d'échecs et horodate
    await this.users.update(user.id, {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    });

    return this.issueTokenPair(user, context);
  }

  private async recordFailedLogin(user: User): Promise<void> {
    const max = this.config.get<number>('AUTH_MAX_FAILED_LOGINS', 5);
    const lockSeconds = this.config.get<number>(
      'AUTH_LOCK_DURATION_SECONDS',
      900,
    );

    const nextCount = user.failedLoginCount + 1;
    const lockedUntil =
      nextCount >= max
        ? new Date(Date.now() + lockSeconds * 1000)
        : user.lockedUntil;

    await this.users.update(user.id, {
      failedLoginCount: nextCount,
      lockedUntil,
    });

    if (nextCount >= max) {
      this.logger.warn(
        `Compte verrouillé après ${nextCount} échecs : ${user.email}`,
      );
      // TODO S7 : émettre une notification critique au titulaire (CDC §7.6.2)
    }
  }

  // -------------------------- Refresh (rotation) --------------------------

  async refresh(
    refreshToken: string,
    context: SessionContext,
  ): Promise<TokenPair> {
    const tokenHash = hashToken(refreshToken);
    const session = await this.sessions.findOne({
      where: { refreshTokenHash: tokenHash },
      relations: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token invalide.',
      });
    }

    // Détection de réutilisation : refresh token déjà révoqué → vol potentiel
    if (session.revokedAt) {
      this.logger.warn(
        `Réutilisation détectée d'un refresh token révoqué pour user ${session.userId}. Révocation totale.`,
      );
      await this.sessions.update(
        { userId: session.userId },
        { revokedAt: new Date() },
      );
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_REUSED',
        message: 'Activité suspecte détectée. Reconnectez-vous.',
      });
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Refresh token expiré.',
      });
    }

    if (!session.user || !session.user.isActive || session.user.deletedAt) {
      throw new UnauthorizedException({
        code: 'USER_DISABLED',
        message: 'Compte désactivé.',
      });
    }

    // Rotation : on révoque l'ancienne session et on en émet une nouvelle
    await this.sessions.update(session.id, {
      revokedAt: new Date(),
      lastUsedAt: new Date(),
    });

    return this.issueTokenPair(session.user, context);
  }

  // -------------------------- Logout --------------------------

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await this.sessions.update(
      { refreshTokenHash: tokenHash, revokedAt: undefined },
      { revokedAt: new Date() },
    );
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessions.update(
      { userId, revokedAt: undefined },
      { revokedAt: new Date() },
    );
  }

  // -------------------------- Password reset --------------------------

  /**
   * Demande de réinitialisation. Retourne toujours sans erreur, même si l'email
   * n'existe pas, pour empêcher l'énumération (CDC §10.2.1).
   * Retourne le secret pour permettre l'envoi par courriel par l'appelant.
   */
  async requestPasswordReset(email: string): Promise<{
    token: string;
    userId: string;
    email: string;
    firstName: string;
  } | null> {
    const user = await this.findUserByEmail(email);
    if (!user || !user.isActive || user.deletedAt) {
      return null;
    }

    const ttl = this.config.get<number>('PASSWORD_RESET_TTL_SECONDS', 1800);
    const token = generateOpaqueToken();

    await this.passwordResetTokens.insert({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + ttl * 1000),
    });

    return {
      token,
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
    };
  }

  async confirmPasswordReset(
    token: string,
    newPassword: string,
  ): Promise<void> {
    const tokenHash = hashToken(token);
    const tokenRecord = await this.passwordResetTokens.findOne({
      where: { tokenHash, usedAt: undefined, expiresAt: MoreThan(new Date()) },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException({
        code: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'Jeton invalide ou expiré.',
      });
    }

    const cost = this.config.get<number>('BCRYPT_COST', 12);
    const passwordHash = await bcrypt.hash(newPassword, cost);

    await this.users.update(tokenRecord.userId, {
      passwordHash,
      lastPasswordChangedAt: new Date(),
      failedLoginCount: 0,
      lockedUntil: null,
    });

    await this.passwordResetTokens.update(tokenRecord.id, {
      usedAt: new Date(),
    });

    // Révoque toutes les sessions actives (CDC §10.2.1 [EXG-10-013])
    await this.sessions.update(
      { userId: tokenRecord.userId, revokedAt: undefined },
      { revokedAt: new Date() },
    );
  }

  // -------------------------- Activation --------------------------

  async activateAccount(token: string, password: string): Promise<void> {
    const tokenHash = hashToken(token);
    const tokenRecord = await this.activationTokens.findOne({
      where: { tokenHash, usedAt: undefined, expiresAt: MoreThan(new Date()) },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException({
        code: 'INVALID_OR_EXPIRED_TOKEN',
        message: "Jeton d'activation invalide ou expiré.",
      });
    }

    const cost = this.config.get<number>('BCRYPT_COST', 12);
    const passwordHash = await bcrypt.hash(password, cost);

    await this.users.update(tokenRecord.userId, {
      passwordHash,
      isActive: true,
      lastPasswordChangedAt: new Date(),
    });

    await this.activationTokens.update(tokenRecord.id, { usedAt: new Date() });
  }

  // -------------------------- Helpers --------------------------

  private async issueTokenPair(
    user: User,
    context: SessionContext,
  ): Promise<TokenPair> {
    const accessTtl = this.config.get<number>('JWT_ACCESS_TTL_SECONDS', 900);
    const refreshTtl = this.config.get<number>(
      'JWT_REFRESH_TTL_SECONDS',
      604_800,
    );

    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        role: user.roleId,
        org: user.organizationId,
      },
      { expiresIn: accessTtl },
    );

    const refreshToken = generateOpaqueToken();
    await this.sessions.insert({
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      clientIp: context.ip ?? null,
      userAgent: context.userAgent ?? null,
      expiresAt: new Date(Date.now() + refreshTtl * 1000),
    });

    return {
      accessToken,
      refreshToken,
      expiresInSeconds: accessTtl,
      user: this.toAuthenticatedUser(user),
    };
  }

  private toAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      organizationId: user.organizationId,
      timeZone: user.timeZone,
    };
  }

  private async findUserByEmail(email: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('u')
      .where('LOWER(u.email) = LOWER(:email)', { email })
      .andWhere('u.deleted_at IS NULL')
      .getOne();
  }
}
