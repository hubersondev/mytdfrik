'use client';

import {
  AlertCircle,
  Download,
  FileText,
  Loader2,
  Paperclip,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Undo2,
  Upload,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { AntivirusStatus, AttachmentView } from '@/lib/attachments';
import { cn } from '@/lib/utils';
import { uploadAttachmentAction, withdrawAttachmentAction } from './actions';

interface Props {
  requestId: string;
  revalidatePath: string;
  attachments: AttachmentView[];
  currentUserId: string;
  /** L'utilisateur peut-il téléverser ? (Client sur sa demande, ou rôle interne habilité) */
  canUpload: boolean;
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1_048_576).toFixed(1)} Mo`;
}

function AntivirusBadge({ status }: { status: AntivirusStatus }) {
  switch (status) {
    case 'CLEAN':
      return (
        <Badge variant="success" className="gap-1">
          <ShieldCheck className="h-3 w-3" />
          Analysée
        </Badge>
      );
    case 'INFECTED':
      return (
        <Badge variant="danger" className="gap-1">
          <ShieldAlert className="h-3 w-3" />
          Rejetée
        </Badge>
      );
    case 'ERROR':
      return (
        <Badge variant="danger" className="gap-1">
          <ShieldAlert className="h-3 w-3" />
          Erreur d’analyse
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1">
          <ShieldQuestion className="h-3 w-3" />
          En vérification
        </Badge>
      );
  }
}

export function AttachmentPanel({
  requestId,
  revalidatePath,
  attachments,
  currentUserId,
  canUpload,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Les pièces « En vérification » se résolvent côté serveur après un court
  // délai (scan antivirus) : on rafraîchit une fois pour récupérer le statut.
  const hasPending = attachments.some((a) => a.antivirusStatus === 'PENDING');
  useEffect(() => {
    if (!hasPending) return;
    const t = setTimeout(() => router.refresh(), 2500);
    return () => clearTimeout(t);
  }, [hasPending, router]);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    startTransition(async () => {
      const result = await uploadAttachmentAction(requestId, revalidatePath, formData);
      if (inputRef.current) inputRef.current.value = '';
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.message ?? 'Échec du téléversement.');
      }
    });
  };

  const withdraw = (attachmentId: string) => {
    const reason = window.prompt('Motif du retrait de la pièce jointe :');
    if (!reason || !reason.trim()) return;
    startTransition(async () => {
      const result = await withdrawAttachmentAction(attachmentId, revalidatePath, reason);
      if (!result.ok && result.message) window.alert(result.message);
      router.refresh();
    });
  };

  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2 p-5 pb-3">
        <Paperclip className="h-4 w-4 text-zinc-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Pièces jointes
        </h2>
      </div>
      <Separator />

      <ul className="flex flex-col divide-y divide-zinc-200/80 dark:divide-zinc-800">
        {attachments.map((a) => {
          const mine = a.uploadedBy?.id === currentUserId;
          return (
            <li key={a.id} className="flex items-center gap-3 px-5 py-3">
              <FileText className="h-5 w-5 shrink-0 text-zinc-400" />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'truncate text-sm font-medium',
                    a.isWithdrawn
                      ? 'italic text-zinc-400 line-through dark:text-zinc-500'
                      : 'text-zinc-900 dark:text-zinc-100',
                  )}
                >
                  {a.originalFilename}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{formatBytes(a.sizeBytes)}</span>
                  <span>·</span>
                  <span>
                    {a.uploadedBy
                      ? `${a.uploadedBy.firstName} ${a.uploadedBy.lastName}`
                      : 'Inconnu'}
                  </span>
                  <span>·</span>
                  <span>{dateFmt.format(new Date(a.createdAt))}</span>
                </p>
                {a.isWithdrawn && a.withdrawalReason && (
                  <p className="mt-1 text-xs italic text-zinc-500 dark:text-zinc-400">
                    Retirée : {a.withdrawalReason}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {a.isWithdrawn ? (
                  <Badge variant="outline">Retirée</Badge>
                ) : (
                  <AntivirusBadge status={a.antivirusStatus} />
                )}
                {!a.isWithdrawn && a.downloadUrl && (
                  <a
                    href={a.downloadUrl}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    title="Télécharger"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
                {mine && !a.isWithdrawn && (
                  <button
                    type="button"
                    onClick={() => withdraw(a.id)}
                    disabled={pending}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                    title="Retirer"
                  >
                    <Undo2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
        {attachments.length === 0 && (
          <li className="px-5 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Aucune pièce jointe.
          </li>
        )}
      </ul>

      {canUpload && (
        <>
          <Separator />
          <div className="flex flex-col gap-2 p-5">
            <input
              ref={inputRef}
              type="file"
              onChange={onSelect}
              disabled={pending}
              className="hidden"
            />
            {error && (
              <p className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                25 Mo max par fichier · pdf, images, bureautique, zip, mp4.
              </p>
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() => inputRef.current?.click()}
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Ajouter un fichier
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
