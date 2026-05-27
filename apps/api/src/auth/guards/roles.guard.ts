import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth.service';
import type { RoleCode } from '../../database/entities';

/**
 * Guard de vérification de rôle. Si la route porte `@Roles(...roles)`, le rôle
 * de l'utilisateur authentifié doit correspondre à l'un d'eux.
 *
 * Référence : matrice de droits CDC §2.3 [EXG-02-003].
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RoleCode[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({ code: 'UNAUTHENTICATED' });
    }

    if (!required.includes(user.roleId as RoleCode)) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_ROLE',
        message: 'Votre rôle ne permet pas cette action.',
      });
    }

    return true;
  }
}
