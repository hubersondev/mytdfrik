import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, apiFetchOr } from '@/lib/api';
import type { CursorPage, OrganizationRow, UserRow } from '@/lib/users';
import { UserForm } from '../../_components/user-form';

function emptyPage<T>(): CursorPage<T> {
  return { items: [], page_info: { has_next: false, next_cursor: null } };
}

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let user: UserRow;
  try {
    user = await apiFetch<UserRow>(`/users/${id}`);
  } catch (error) {
    if ((error as { status?: number })?.status === 404) notFound();
    throw error;
  }

  const orgs = await apiFetchOr<CursorPage<OrganizationRow>>(
    '/organizations?limit=100',
    emptyPage<OrganizationRow>(),
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/users"
          className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux utilisateurs
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-leaf-50 text-leaf-700 dark:bg-leaf-950/60 dark:text-leaf-300">
            <Pencil className="h-4.5 w-4.5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{user.email}</p>
          </div>
        </div>
      </div>

      <UserForm
        mode="edit"
        userId={user.id}
        organizations={orgs.items}
        defaultValues={{
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          roleId: user.roleId,
          organizationId: user.organizationId ?? '',
          phone: user.phone ?? '',
          timeZone: user.timeZone ?? 'Africa/Abidjan',
        }}
      />
    </div>
  );
}
