import * as Joi from 'joi';

/**
 * Schéma de validation des variables d'environnement.
 *
 * Toute clé manquante ou invalide entraîne l'échec au démarrage (fail-fast).
 * Les valeurs par défaut ne sont fournies que pour les variables non sensibles.
 */
export const configValidationSchema = Joi.object({
  // Environnement applicatif
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  LOG_LEVEL: Joi.string()
    .valid('trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent')
    .default('info'),
  CORS_ORIGINS: Joi.string().default('http://localhost:3001'),

  // Persistance — obligatoires depuis S1
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .optional(),

  // JWT (CDC §9.3, §10.2.3)
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL_SECONDS: Joi.number().integer().min(60).default(900), // 15 min
  JWT_REFRESH_TTL_SECONDS: Joi.number().integer().min(3600).default(604_800), // 7 jours

  // Verrouillage des comptes (CDC §10.2.2)
  AUTH_MAX_FAILED_LOGINS: Joi.number().integer().min(1).default(5),
  AUTH_LOCK_DURATION_SECONDS: Joi.number().integer().min(60).default(900), // 15 min
  AUTH_LOCK_WINDOW_SECONDS: Joi.number().integer().min(60).default(900), // 15 min

  // Réinitialisation et activation (CDC §10.2.1, §3.3)
  PASSWORD_RESET_TTL_SECONDS: Joi.number().integer().min(300).default(1_800), // 30 min
  ACCOUNT_ACTIVATION_TTL_SECONDS: Joi.number()
    .integer()
    .min(3600)
    .default(259_200), // 72 h

  // Hash bcrypt cost (CDC §10.2.1)
  BCRYPT_COST: Joi.number().integer().min(10).max(15).default(12),

  // Sentry (optionnel en dev, requis en production)
  SENTRY_DSN: Joi.string().uri().optional().allow(''),

  // Email transactionnel (CDC §7.4)
  // Priorité : SMTP (Mailpit en local) > Resend (prod) > DEV (log only).
  SMTP_HOST: Joi.string().optional().allow(''),
  SMTP_PORT: Joi.number().default(1025),
  SMTP_USER: Joi.string().optional().allow(''),
  SMTP_PASSWORD: Joi.string().optional().allow(''),
  RESEND_API_KEY: Joi.string().optional().allow(''),
  MAIL_FROM_ADDRESS: Joi.string().email().default('onboarding@resend.dev'),
  MAIL_FROM_NAME: Joi.string().default('MyTDFRIK · TECHDIFRIK'),

  // URL publique du front (sert à construire les liens dans les courriels)
  APP_WEB_BASE_URL: Joi.string().uri().default('http://localhost:3001'),

  // Délai de validation d'une résolution avant clôture automatique T17
  // (CDC §4.6 [EXG-04-031]). 7 jours par défaut.
  RESOLUTION_VALIDATION_EXPIRY_DAYS: Joi.number().integer().min(1).default(7),

  // URL publique de l'API (sert à construire les liens de téléchargement signés)
  API_PUBLIC_BASE_URL: Joi.string().uri().default('http://localhost:3000'),

  // Pièces jointes & stockage (CDC §3.8, §11.4)
  // En dev, le driver « local » écrit sur le disque ; « s3 » (Scaleway Object
  // Storage) sera branché en staging/prod via @aws-sdk/client-s3.
  STORAGE_DRIVER: Joi.string().valid('local', 's3').default('local'),
  STORAGE_LOCAL_DIR: Joi.string().default('.storage'),
  S3_BUCKET: Joi.string().optional().allow(''),
  S3_REGION: Joi.string().optional().allow(''),
  S3_ENDPOINT: Joi.string().uri().optional().allow(''),
  S3_ACCESS_KEY_ID: Joi.string().optional().allow(''),
  S3_SECRET_ACCESS_KEY: Joi.string().optional().allow(''),
  ATTACHMENT_MAX_FILE_BYTES: Joi.number().integer().min(1).default(26_214_400), // 25 Mio par fichier [EXG-03-062]
  ATTACHMENT_MAX_REQUEST_BYTES: Joi.number()
    .integer()
    .min(1)
    .default(104_857_600), // 100 Mio cumulés par demande [EXG-03-062]
  ATTACHMENT_DOWNLOAD_TTL_SECONDS: Joi.number().integer().min(60).default(300), // URL de téléchargement signée valide 5 min [EXG-03-064]
  // Scan antivirus simulé en dev (ClamAV indisponible en local) : délai avant
  // de passer PENDING → CLEAN. Mettre 0 pour un scan immédiat (tests).
  ANTIVIRUS_SIMULATED_DELAY_MS: Joi.number().integer().min(0).default(1_500),

  // Bootstrap : compte admin de démarrage (utilisé par les seeds)
  ADMIN_BOOTSTRAP_EMAIL: Joi.string().email().optional(),
  ADMIN_BOOTSTRAP_PASSWORD: Joi.string().min(12).optional(),
  ADMIN_BOOTSTRAP_FIRST_NAME: Joi.string().default('Admin'),
  ADMIN_BOOTSTRAP_LAST_NAME: Joi.string().default('Bootstrap'),
});
