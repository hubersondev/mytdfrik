import { SetMetadata } from '@nestjs/common';

export const AUDIT_ACTION_KEY = 'audit:action';
export const AUDIT_OBJECT_TYPE_KEY = 'audit:objectType';
export const AUDIT_SKIP_KEY = 'audit:skip';

/**
 * Précise le code d'action métier audité pour une route mutante.
 * Exemple : `@AuditAction('USER_CREATED', 'User')`
 *
 * Sans décorateur, l'interceptor utilise `${METHOD}:${PATH}` comme fallback.
 */
export const AuditAction = (
  actionCode: string,
  objectType: string,
): MethodDecorator => {
  const setAction = SetMetadata(AUDIT_ACTION_KEY, actionCode);
  const setType = SetMetadata(AUDIT_OBJECT_TYPE_KEY, objectType);
  return (target, key, descriptor) => {
    setAction(target, key, descriptor);
    setType(target, key, descriptor);
    return descriptor;
  };
};

/**
 * Marque une route mutante comme non auditée. Utile pour /auth/login (déjà
 * audité par un mécanisme dédié) ou les opérations très volumineuses (uploads).
 */
export const SkipAudit = (): MethodDecorator =>
  SetMetadata(AUDIT_SKIP_KEY, true);
