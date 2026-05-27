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

  // Bootstrap : compte admin de démarrage (utilisé par les seeds)
  ADMIN_BOOTSTRAP_EMAIL: Joi.string().email().optional(),
  ADMIN_BOOTSTRAP_PASSWORD: Joi.string().min(12).optional(),
  ADMIN_BOOTSTRAP_FIRST_NAME: Joi.string().default('Admin'),
  ADMIN_BOOTSTRAP_LAST_NAME: Joi.string().default('Bootstrap'),
});
