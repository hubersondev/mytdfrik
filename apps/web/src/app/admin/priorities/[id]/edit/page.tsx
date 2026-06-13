import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, priorityVariant } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import type { PriorityCode } from '@/lib/requests';
import { PriorityForm } from '../../_components/priority-form';
import type { PriorityLevelRow } from '../../page';

export default async function EditPriorityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let level: PriorityLevelRow;
  try {
    level = await apiFetch<PriorityLevelRow>(`/priority-levels/${encodeURIComponent(id)}`);
  } catch (error) {
    if ((error as { status?: number })?.status === 404) notFound();
    throw error;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/priorities"
          className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux priorités
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-leaf-50 text-leaf-700 dark:bg-leaf-950/60 dark:text-leaf-300">
            <Pencil className="h-5 w-5" />
          </span>
          <div className="flex items-center gap-2">
            <Badge variant={priorityVariant(level.id as PriorityCode)}>{level.id}</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {level.label}
            </h1>
          </div>
        </div>
      </div>

      <PriorityForm
        priorityId={level.id}
        defaultValues={{
          label: level.label,
          description: level.description ?? '',
          slaFirstResponseMinutes: level.slaFirstResponseMinutes,
          slaResolutionMinutes: level.slaResolutionMinutes,
          is24x7: level.is24x7,
        }}
      />
    </div>
  );
}
