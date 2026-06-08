import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface StoredObject {
  bucket: string;
  key: string;
  etag: string | null;
}

/**
 * Abstraction du stockage objet des pièces jointes (CDC §3.8, §11.4).
 *
 * Driver `local` (défaut dev) : écrit sur disque sous STORAGE_LOCAL_DIR et
 * fabrique des URL de téléchargement signées (HMAC + expiration) servies par
 * l'API. Driver `s3` : à brancher en staging/prod via @aws-sdk/client-s3 et
 * @aws-sdk/s3-request-presigner (URL présignées natives). L'interface est
 * volontairement identique pour que la bascule soit transparente.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly driver: 'local' | 's3';
  private readonly localDir: string;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.driver = this.config.get<'local' | 's3'>('STORAGE_DRIVER', 'local');
    this.localDir = resolve(
      process.cwd(),
      this.config.get<string>('STORAGE_LOCAL_DIR', '.storage'),
    );
    this.bucket =
      this.driver === 's3'
        ? (this.config.get<string>('S3_BUCKET') ?? 'mytdfrik')
        : 'local';
    if (this.driver === 's3') {
      // Garde-fou : le driver S3 n'est pas câblé dans ce build (infra dev).
      this.logger.warn(
        'STORAGE_DRIVER=s3 sélectionné mais le driver S3 n’est pas implémenté dans ce build. Branchez @aws-sdk/client-s3 (cf. CDC §11.4).',
      );
    }
  }

  /** Clé de stockage déterministe et non devinable pour une pièce jointe. */
  buildKey(requestId: string, originalFilename: string): string {
    const safe = originalFilename
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(-100);
    return `requests/${requestId}/${randomUUID()}__${safe}`;
  }

  // Note : le type MIME n'est pas requis par le driver local ; le driver S3
  // (à venir) le passera en ContentType de l'objet présigné.
  async put(key: string, buffer: Buffer): Promise<StoredObject> {
    if (this.driver === 's3') {
      throw new Error('STORAGE_DRIVER=s3 non implémenté dans ce build.');
    }
    const path = this.localPath(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, buffer);
    const etag = createHmac('sha256', 'etag')
      .update(buffer)
      .digest('hex')
      .slice(0, 32);
    return { bucket: this.bucket, key, etag };
  }

  async get(key: string): Promise<Buffer> {
    if (this.driver === 's3') {
      throw new Error('STORAGE_DRIVER=s3 non implémenté dans ce build.');
    }
    return readFile(this.localPath(key));
  }

  async remove(key: string): Promise<void> {
    if (this.driver === 's3') return;
    await rm(this.localPath(key), { force: true });
  }

  /**
   * Fabrique une URL de téléchargement signée et expirante (CDC §3.8
   * [EXG-03-064]). Pour le driver local, l'URL pointe vers l'endpoint public
   * `/requests/attachments/download` de l'API, qui valide la signature.
   */
  buildSignedDownloadUrl(attachmentId: string): string {
    const ttl = this.config.get<number>('ATTACHMENT_DOWNLOAD_TTL_SECONDS', 300);
    const exp = Math.floor(Date.now() / 1000) + ttl;
    const sig = this.sign(attachmentId, exp);
    const base = this.config
      .get<string>('API_PUBLIC_BASE_URL', 'http://localhost:3000')
      .replace(/\/$/, '');
    const params = new URLSearchParams({
      id: attachmentId,
      exp: String(exp),
      sig,
    });
    return `${base}/api/v1/requests/attachments/download?${params.toString()}`;
  }

  /** Vérifie une signature de téléchargement. Retourne false si invalide/expirée. */
  verifyDownloadSignature(
    attachmentId: string,
    exp: number,
    sig: string,
  ): boolean {
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    const expected = this.sign(attachmentId, exp);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private sign(attachmentId: string, exp: number): string {
    const secret = this.config.get<string>('JWT_SECRET') ?? 'dev-secret';
    return createHmac('sha256', secret)
      .update(`${attachmentId}.${exp}`)
      .digest('hex');
  }

  private localPath(key: string): string {
    // Empêche toute remontée hors du répertoire de stockage.
    const normalized = key.replace(/\\/g, '/').replace(/\.\.+/g, '');
    return join(this.localDir, normalized);
  }
}
