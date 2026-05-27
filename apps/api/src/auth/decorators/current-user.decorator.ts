import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth.service';

/**
 * Injection de l'utilisateur authentifié courant dans un handler.
 * Exemple : `async profile(@CurrentUser() user: AuthenticatedUser) { … }`
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    if (!request.user) {
      throw new Error(
        'CurrentUser ne peut être utilisé que sur une route protégée par JwtAuthGuard.',
      );
    }
    return request.user;
  },
);
