import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { SkipAudit } from '../audit/audit-action.decorator';

@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  /**
   * Endpoint de sonde publique — utilisé par les checks d'infrastructure et la CI.
   * Pas d'auth requise, pas de rate limiting, pas d'audit (sondes fréquentes).
   * CDC §9.11 [EXG-09-092].
   */
  @Get()
  @Public()
  @SkipThrottle()
  @SkipAudit()
  @ApiOperation({ summary: 'Vérification de disponibilité du service' })
  @ApiOkResponse({
    schema: {
      example: {
        status: 'ok',
        service: 'mytdfrik-api',
        version: '0.0.0',
        timestamp: '2026-05-27T16:00:00.000Z',
      },
    },
  })
  check(): {
    status: 'ok';
    service: string;
    version: string;
    timestamp: string;
  } {
    return {
      status: 'ok',
      service: 'mytdfrik-api',
      version: process.env.npm_package_version ?? '0.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
