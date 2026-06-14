import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { configValidationSchema } from './config/config.schema';
import { DatabaseModule } from './database/database.module';
import { GeoModule } from './geo/geo.module';
import { HealthModule } from './health/health.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RbacModule } from './rbac/rbac.module';
import { ReportingModule } from './reporting/reporting.module';
import { RequestsModule } from './requests/requests.module';
import { SearchModule } from './search/search.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: configValidationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
    LoggerModule.forRootAsync({
      useFactory: () => ({
        pinoHttp: {
          level: process.env.LOG_LEVEL ?? 'info',
          transport:
            process.env.NODE_ENV === 'development'
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
          autoLogging: true,
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              '*.password',
              '*.token',
            ],
            censor: '[REDACTED]',
          },
        },
      }),
    }),
    ThrottlerModule.forRoot([
      {
        // Limites globales par IP (CDC §9.10) — surchargeables par décorateur sur les routes sensibles
        ttl: 60_000,
        limit: 60,
      },
    ]),
    // Jobs planifiés (clôture automatique T17 — CDC §4.6).
    ScheduleModule.forRoot(),
    // Broker d'événements in-process pour les notifications (CDC §7 [EXG-07-004]).
    EventEmitterModule.forRoot(),
    DatabaseModule,
    MailModule,
    RbacModule,
    AuthModule,
    AuditModule,
    UsersModule,
    CatalogModule,
    GeoModule,
    RequestsModule,
    SearchModule,
    NotificationsModule,
    ReportingModule,
    HealthModule,
  ],
  providers: [
    {
      // Rate limiting global. Doit être déclaré avant JwtAuthGuard pour s'appliquer aux routes publiques.
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
