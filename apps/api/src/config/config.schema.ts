import * as Joi from 'joi';

/**
 * Schéma de validation des variables d'environnement.
 *
 * Toute clé manquante ou invalide entraîne l'échec au démarrage (fail-fast).
 * Les valeurs par défaut ne sont fournies que pour les variables non sensibles.
 */
export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  LOG_LEVEL: Joi.string()
    .valid('trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent')
    .default('info'),
  CORS_ORIGINS: Joi.string().default('http://localhost:3001'),

  // À renseigner dès le S1 / S2 — laissés optionnels au S0
  DATABASE_URL: Joi.string().uri().optional(),
  REDIS_URL: Joi.string().uri().optional(),
  SENTRY_DSN: Joi.string().uri().optional().allow(''),
});
