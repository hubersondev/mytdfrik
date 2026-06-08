import { extname } from 'node:path';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import {
  type AntivirusStatus,
  Request,
  RequestAttachment,
} from '../database/entities';
import { StorageService } from '../storage/storage.service';
import type { WithdrawAttachmentDto } from './dto/attachment.dto';
import type { TransitionViewer } from './transitions.service';

/** Fichier téléversé (forme runtime de Multer, sans dépendance de typage). */
export interface UploadedFileLike {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface AttachmentView {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  antivirusStatus: AntivirusStatus;
  isWithdrawn: boolean;
  withdrawalReason: string | null;
  createdAt: Date;
  uploadedBy: { id: string; firstName: string; lastName: string } | null;
  /** URL de téléchargement signée (5 min), présente seulement si téléchargeable. */
  downloadUrl: string | null;
}

export interface DownloadPayload {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

// Allowlist des extensions autorisées (CDC §3.8 [EXG-03-061]).
const ALLOWED_EXTENSIONS = new Set([
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'txt',
  'log',
  'csv',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'zip',
  'mp4',
]);

// Signature du fichier de test antivirus EICAR (standard, inoffensif). Permet
// de démontrer le rejet d'un fichier « infecté » sans vrai malware.
const EICAR_SIGNATURE =
  'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

/**
 * Pièces jointes des demandes (CDC §3.8). Validation formats/tailles, stockage
 * objet, analyse antivirus (simulée en dev), retrait non destructif et
 * téléchargement via URL signée expirante.
 */
@Injectable()
export class AttachmentsService {
  private readonly logger = new Logger(AttachmentsService.name);

  constructor(
    @InjectRepository(Request) private readonly requests: Repository<Request>,
    @InjectRepository(RequestAttachment)
    private readonly attachments: Repository<RequestAttachment>,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
  ) {}

  async list(
    viewer: TransitionViewer,
    requestId: string,
  ): Promise<AttachmentView[]> {
    const req = await this.loadReadable(viewer, requestId);
    const rows = await this.attachments.find({
      where: { requestId: req.id },
      relations: { uploadedBy: true },
      order: { createdAt: 'ASC' },
    });
    // Une pièce retirée reste visible des rôles internes (avec motif, sans
    // téléchargement) mais est masquée au Client (CDC §3.8 [EXG-03-065]).
    return rows
      .filter((a) => !a.isWithdrawn || viewer.scope === 'INTERNAL')
      .map((a) => this.toView(a));
  }

  async upload(
    viewer: TransitionViewer,
    requestId: string,
    file: UploadedFileLike | undefined,
  ): Promise<AttachmentView> {
    if (!file) {
      throw new BadRequestException({
        code: 'NO_FILE',
        message: 'Aucun fichier reçu.',
      });
    }
    const req = await this.loadReadable(viewer, requestId);
    this.assertCanUpload(viewer, req);

    const ext = extname(file.originalname).replace('.', '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new BadRequestException({
        code: 'UNSUPPORTED_FILE_TYPE',
        message: `Format non autorisé (.${ext}). Formats acceptés : ${[...ALLOWED_EXTENSIONS].join(', ')}.`,
      });
    }

    const maxFile = this.config.get<number>(
      'ATTACHMENT_MAX_FILE_BYTES',
      26_214_400,
    );
    if (file.size > maxFile) {
      throw new PayloadTooLargeException({
        code: 'FILE_TOO_LARGE',
        message: `Fichier trop volumineux (max ${Math.floor(maxFile / 1_048_576)} Mo par fichier).`,
      });
    }

    const maxRequest = this.config.get<number>(
      'ATTACHMENT_MAX_REQUEST_BYTES',
      104_857_600,
    );
    const current = await this.currentRequestBytes(req.id);
    if (current + file.size > maxRequest) {
      throw new PayloadTooLargeException({
        code: 'REQUEST_QUOTA_EXCEEDED',
        message: `Quota de la demande dépassé (max ${Math.floor(maxRequest / 1_048_576)} Mo cumulés).`,
      });
    }

    const key = this.storage.buildKey(req.id, file.originalname);
    const stored = await this.storage.put(key, file.buffer);

    const saved = await this.attachments.save(
      this.attachments.create({
        requestId: req.id,
        messageId: null,
        uploadedByUserId: viewer.id,
        originalFilename: file.originalname.slice(0, 255),
        mimeType: file.mimetype.slice(0, 120),
        sizeBytes: String(file.size),
        storageBucket: stored.bucket,
        storageKey: stored.key,
        storageEtag: stored.etag,
        antivirusStatus: 'PENDING',
      }),
    );

    this.scheduleScan(saved.id, key);

    const full = await this.attachments.findOne({
      where: { id: saved.id },
      relations: { uploadedBy: true },
    });
    return this.toView(full ?? saved);
  }

  async withdraw(
    viewer: TransitionViewer,
    attachmentId: string,
    dto: WithdrawAttachmentDto,
  ): Promise<AttachmentView> {
    const att = await this.attachments.findOne({
      where: { id: attachmentId },
      relations: { uploadedBy: true },
    });
    if (!att) throw new NotFoundException({ code: 'ATTACHMENT_NOT_FOUND' });
    if (att.uploadedByUserId !== viewer.id) {
      throw new ForbiddenException({
        code: 'NOT_ATTACHMENT_OWNER',
        message: 'Seul l’auteur peut retirer sa pièce jointe.',
      });
    }
    if (!att.isWithdrawn) {
      att.isWithdrawn = true;
      att.withdrawalReason = dto.reason.trim();
      await this.attachments.save(att);
    }
    return this.toView(att);
  }

  /** Résout un téléchargement à partir d'une URL signée (endpoint public). */
  async resolveSignedDownload(
    attachmentId: string,
    exp: number,
    sig: string,
  ): Promise<DownloadPayload> {
    if (!this.storage.verifyDownloadSignature(attachmentId, exp, sig)) {
      throw new ForbiddenException({
        code: 'INVALID_DOWNLOAD_TOKEN',
        message: 'Lien de téléchargement invalide ou expiré.',
      });
    }
    const att = await this.attachments.findOne({
      where: { id: attachmentId },
    });
    if (!att) throw new NotFoundException({ code: 'ATTACHMENT_NOT_FOUND' });
    if (att.isWithdrawn) {
      throw new ForbiddenException({ code: 'ATTACHMENT_WITHDRAWN' });
    }
    if (att.antivirusStatus !== 'CLEAN') {
      throw new ForbiddenException({
        code: 'ATTACHMENT_NOT_AVAILABLE',
        message:
          'Pièce jointe indisponible (analyse antivirus en cours ou échouée).',
      });
    }
    const buffer = await this.storage.get(att.storageKey);
    return { buffer, filename: att.originalFilename, mimeType: att.mimeType };
  }

  // -------------------- Antivirus (simulé en dev) --------------------

  /**
   * Programme l'analyse antivirus. ClamAV n'étant pas disponible en local, on
   * simule : détection de la signature de test EICAR → INFECTED, sinon CLEAN,
   * après un court délai configurable (ANTIVIRUS_SIMULATED_DELAY_MS).
   * En staging/prod, remplacer par un job BullMQ qui appelle clamd.
   */
  private scheduleScan(attachmentId: string, key: string): void {
    const delay = this.config.get<number>(
      'ANTIVIRUS_SIMULATED_DELAY_MS',
      1_500,
    );
    const run = () => {
      void this.runScan(attachmentId, key);
    };
    if (delay <= 0) run();
    else setTimeout(run, delay).unref?.();
  }

  private async runScan(attachmentId: string, key: string): Promise<void> {
    let status: AntivirusStatus = 'CLEAN';
    try {
      const buffer = await this.storage.get(key);
      if (buffer.includes(EICAR_SIGNATURE)) status = 'INFECTED';
    } catch (error) {
      status = 'ERROR';
      this.logger.warn(
        `Analyse antivirus en échec pour ${attachmentId}: ${(error as Error).message}`,
      );
    }
    await this.attachments.update(
      { id: attachmentId },
      { antivirusStatus: status, antivirusCheckedAt: new Date() },
    );
    if (status === 'INFECTED') {
      // Notification de l'auteur prévue au S8 (CDC §3.8 [EXG-03-063]).
      this.logger.warn(`Pièce jointe ${attachmentId} rejetée (INFECTED).`);
    }
  }

  // -------------------- Helpers --------------------

  private async loadReadable(
    viewer: TransitionViewer,
    requestId: string,
  ): Promise<Request> {
    const req = await this.requests.findOne({
      where: { id: requestId, deletedAt: IsNull() },
    });
    if (!req) throw new NotFoundException({ code: 'REQUEST_NOT_FOUND' });
    if (
      viewer.scope === 'CLIENT' &&
      req.organizationId !== viewer.organizationId
    ) {
      throw new NotFoundException({ code: 'REQUEST_NOT_FOUND' });
    }
    return req;
  }

  private assertCanUpload(viewer: TransitionViewer, req: Request): void {
    if (viewer.scope === 'INTERNAL') {
      if (!viewer.permissions.includes('requests.attachment')) {
        throw new ForbiddenException({
          code: 'ATTACHMENT_NOT_ALLOWED',
          message:
            "Vous n'avez pas la permission d'ajouter des pièces jointes.",
        });
      }
      return;
    }
    // Client : uniquement sur ses propres demandes (anti-énumération masquée).
    if (req.createdByUserId !== viewer.id) {
      throw new NotFoundException({ code: 'REQUEST_NOT_FOUND' });
    }
  }

  private async currentRequestBytes(requestId: string): Promise<number> {
    const rows = await this.attachments.find({
      where: {
        requestId,
        isWithdrawn: false,
        antivirusStatus: Not('INFECTED'),
      },
      select: { sizeBytes: true },
    });
    return rows.reduce((sum, r) => sum + Number(r.sizeBytes), 0);
  }

  private toView(a: RequestAttachment): AttachmentView {
    const downloadable = !a.isWithdrawn && a.antivirusStatus === 'CLEAN';
    return {
      id: a.id,
      originalFilename: a.originalFilename,
      mimeType: a.mimeType,
      sizeBytes: Number(a.sizeBytes),
      antivirusStatus: a.antivirusStatus,
      isWithdrawn: a.isWithdrawn,
      withdrawalReason: a.withdrawalReason,
      createdAt: a.createdAt,
      uploadedBy: a.uploadedBy
        ? {
            id: a.uploadedBy.id,
            firstName: a.uploadedBy.firstName,
            lastName: a.uploadedBy.lastName,
          }
        : null,
      downloadUrl: downloadable
        ? this.storage.buildSignedDownloadUrl(a.id)
        : null,
    };
  }
}
