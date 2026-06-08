/**
 * Domaine « Pièces jointes » côté front (CDC §3.8). Le binaire n'est jamais
 * exposé directement : `downloadUrl` est une URL signée et expirante servie
 * par l'API, présente uniquement quand la pièce est téléchargeable
 * (analyse antivirus CLEAN et non retirée).
 */
export type AntivirusStatus = 'PENDING' | 'CLEAN' | 'INFECTED' | 'ERROR';

export interface AttachmentView {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  antivirusStatus: AntivirusStatus;
  isWithdrawn: boolean;
  withdrawalReason: string | null;
  createdAt: string;
  uploadedBy: { id: string; firstName: string; lastName: string } | null;
  downloadUrl: string | null;
}
