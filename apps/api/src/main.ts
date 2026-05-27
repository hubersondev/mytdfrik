import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Logger structuré Pino (CDC §11.7.1)
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);
  const environment = config.get<string>('NODE_ENV', 'development');

  // En-têtes de sécurité (CDC §10.5.1)
  app.use(helmet());

  // CORS — restrictif en production, permissif en dev
  const corsOrigins = config.get<string>(
    'CORS_ORIGINS',
    'http://localhost:3001',
  );
  app.enableCors({
    origin: corsOrigins.split(',').map((o) => o.trim()),
    credentials: true,
  });

  // Préfixe global et versionning de l'API (CDC §9.1)
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Validation globale via class-validator (CDC §10.5.2)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Spécification OpenAPI (CDC §9.12)
  if (environment !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('MyTDFRIK API')
      .setDescription(
        'API de gestion centralisée des demandes clients TECHDIFRIK',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/v1/docs', app, document);
  }

  // Arrêt propre (signaux SIGTERM/SIGINT) — utile en Docker
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');
  app
    .get(Logger)
    .log(
      `MyTDFRIK API démarrée — http://localhost:${port}/api/v1 — env=${environment}`,
    );
}

bootstrap().catch((error) => {
  console.error('Erreur fatale au démarrage', error);
  process.exit(1);
});
