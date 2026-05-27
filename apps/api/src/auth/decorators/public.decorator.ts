import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marque une route comme publique (sans authentification requise).
 * Utilisé sur les endpoints /auth/login, /auth/password-reset/request, /health, etc.
 */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
