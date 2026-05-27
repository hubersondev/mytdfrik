import { createHash, randomBytes } from 'node:crypto';

/**
 * Génère un secret cryptographique URL-safe (base64url) de 64 octets aléatoires.
 * Utilisé pour les refresh tokens, jetons de réinitialisation et d'activation.
 */
export function generateOpaqueToken(): string {
  return randomBytes(64).toString('base64url');
}

/**
 * Hash SHA-256 hex d'un secret opaque. Stocké en base à la place du secret.
 * Permet la vérification rapide sans réversibilité.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
