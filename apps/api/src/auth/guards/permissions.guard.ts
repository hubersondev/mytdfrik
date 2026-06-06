import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedUser } from '../auth.service';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

/**
 * Guard d'autorisation par permissions (ADR-004). Si la route porte
 * `@RequirePermissions(...)`, l'utilisateur doit posséder **toutes** les
 * permissions requises (présentes dans `req.user.permissions`, résolues par
 * la stratégie JWT). L'ADMIN les possède toutes → bypass automatique.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(
      PERMISSIONS_KEY,
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

    const granted = new Set(user.permissions ?? []);
    const missing = required.filter((code) => !granted.has(code));
    if (missing.length > 0) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Vous ne disposez pas des permissions nécessaires.',
        details: { missing },
      });
    }

    return true;
  }
}
