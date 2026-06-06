import { ArrowLeft, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { apiFetchOr } from '@/lib/api';
import type { CursorPage, OrganizationRow } from '@/lib/users';
import { UserForm } from '../_components/user-form';

function emptyPage<T>(): CursorPage<T> {
  return { items: [], page_info: { has_next: false, next_cursor: null } };
}

export default async function NewUserPage() {
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
            <UserPlus className="h-4.5 w-4.5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Nouvel utilisateur
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Le compte sera créé inactif jusqu&apos;à l&apos;activation par e-mail.
            </p>
          </div>
        </div>
      </div>

      <UserForm mode="create" organizations={orgs.items} />
    </div>
  );
}
