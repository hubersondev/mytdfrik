import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';
import type { AuthenticatedUser } from '../auth/auth.service';
import type { RoleCode } from '../database/entities';
import {
  AUDIT_ACTION_KEY,
  AUDIT_OBJECT_TYPE_KEY,
  AUDIT_SKIP_KEY,
} from './audit-action.decorator';
import { AuditService } from './audit.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const SENSITIVE_KEYS = new Set([
  'password',
  'new_password',
  'old_password',
  'token',
  'refresh_token',
  'access_token',
  'authorization',
]);

/**
 * Intercepteur global du journal d'audit (CDC §3.13, §10.6).
 *
 * Capture chaque requête mutante (POST/PUT/PATCH/DELETE), enregistre une entrée
 * dans audit_log après l'exécution réussie du handler. Les actions sensibles
 * peuvent être annotées via @AuditAction(action, objectType) ou exclues via @SkipAudit().
 *
 * L'écriture est asynchrone et best-effort : un échec ne bloque jamais la
 * réponse au client.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    if (!MUTATING_METHODS.has(request.method)) {
      return next.handle();
    }

    const skip = this.reflector.getAllAndOverride<boolean>(AUDIT_SKIP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return next.handle();
    }

    const explicitAction = this.reflector.getAllAndOverride<string>(
      AUDIT_ACTION_KEY,
      [context.getHandler(), context.getClass()],
    );
    const explicitObjectType = this.reflector.getAllAndOverride<string>(
      AUDIT_OBJECT_TYPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const actionCode = explicitAction ?? `${request.method}:${request.url}`;
    const objectType = explicitObjectType ?? 'http';

    const requestSnapshot = {
      method: request.method,
      url: request.url,
      params: this.sanitize(request.params),
      query: this.sanitize(request.query),
      body: this.sanitize(request.body),
    };

    return next.handle().pipe(
      tap({
        next: (response) => {
          void this.persist(request, {
            actionCode,
            objectType,
            payload: {
              request: requestSnapshot,
              response: this.summarizeResponse(response),
            },
          });
        },
      }),
    );
  }

  private async persist(
    request: Request & { user?: AuthenticatedUser },
    partial: {
      actionCode: string;
      objectType: string;
      payload: Record<string, unknown>;
    },
  ): Promise<void> {
    try {
      const actorRole = (request.user?.roleId as RoleCode | undefined) ?? null;
      await this.auditService.record({
        actorUserId: request.user?.id ?? null,
        actorRole,
        actionCode: partial.actionCode,
        objectType: partial.objectType,
        objectId: this.extractObjectId(request),
        payload: partial.payload,
        clientIp: request.ip ?? null,
        userAgent: request.headers['user-agent'] ?? null,
        requestIdCorrelation:
          (request.headers['x-request-id'] as string | undefined) ?? null,
      });
    } catch (error) {
      this.logger.error('Échec écriture audit_log', error as Error);
    }
  }

  private sanitize(input: unknown): Record<string, unknown> | null {
    if (!input || typeof input !== 'object') {
      return null;
    }
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      input as Record<string, unknown>,
    )) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        out[key] = '[REDACTED]';
      } else if (value && typeof value === 'object') {
        out[key] = this.sanitize(value);
      } else {
        out[key] = value;
      }
    }
    return out;
  }

  private summarizeResponse(response: unknown): Record<string, unknown> | null {
    if (!response || typeof response !== 'object') {
      return null;
    }
    const sanitized = this.sanitize(response);
    if (!sanitized) return null;
    // Truncate volumineux pour préserver la table audit
    const json = JSON.stringify(sanitized);
    if (json.length > 8_000) {
      return { _truncated: true, sizeBytes: json.length };
    }
    return sanitized;
  }

  private extractObjectId(request: Request): string | null {
    const params = request.params as Record<string, string | undefined>;
    return params?.id ?? params?.uuid ?? null;
  }
}
