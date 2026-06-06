import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, apiFetchOr } from '@/lib/api';
import { SCOPE_SHORT, type PermissionDef, type RoleRow } from '@/lib/roles';
import { RoleForm } from '../../_components/role-form';

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let role: RoleRow;
  try {
    role = await apiFetch<RoleRow>(`/roles/${encodeURIComponent(id)}`);
  } catch (error) {
    if ((error as { status?: number })?.status === 404) notFound();
    throw error;
  }

  const catalog = await apiFetchOr<{ items: PermissionDef[] }>('/permissions', {
    items: [],
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/roles"
          className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux rôles
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-leaf-50 text-leaf-700 dark:bg-leaf-950/60 dark:text-leaf-300">
            <Pencil className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {role.label}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              <span className="font-mono">{role.id}</span> · {SCOPE_SHORT[role.scope]}
            </p>
          </div>
        </div>
      </div>

      <RoleForm
        mode="edit"
        roleId={role.id}
        isSystem={role.isSystem}
        catalog={catalog.items}
        defaultValues={{
          code: role.id,
          label: role.label,
          description: role.description ?? '',
          scope: role.scope,
          isActive: role.isActive,
          permissions: role.permissions,
        }}
      />
    </div>
  );
}
