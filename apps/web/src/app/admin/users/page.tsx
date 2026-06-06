import { CheckCircle2, ShieldCheck, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetchOr } from '@/lib/api';
import { fetchRoleOptions } from '@/lib/role-options';
import {
  applyClientSideView,
  roleKeyFromQuery,
  roleVariant,
  sortKeyFromQuery,
  statusKeyFromQuery,
  type CursorPage,
  type OrganizationRow,
  type UserRow,
} from '@/lib/users';
import { UserActionsMenu } from './_components/user-actions-menu';
import { UsersToolbar } from './_components/users-toolbar';

function emptyPage<T>(): CursorPage<T> {
  return { items: [], page_info: { has_next: false, next_cursor: null } };
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : dateFmt.format(d);
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string;
    status?: string;
    sort?: string;
    q?: string;
    created?: string;
    updated?: string;
  }>;
}) {
  const params = await searchParams;
  const role = roleKeyFromQuery(params.role);
  const status = statusKeyFromQuery(params.status);
  const sort = sortKeyFromQuery(params.sort);
  const query = params.q ?? '';

  // Le filtre rôle est délégué à l'API ; statut + recherche + tri sont appliqués
  // en mémoire (jeu de données borné à 100, cohérent avec le reste de l'admin).
  const qs = new URLSearchParams({ limit: '100' });
  if (role !== 'ALL') qs.set('role', role);

  const [usersPage, orgsPage, roles] = await Promise.all([
    apiFetchOr<CursorPage<UserRow>>(`/users?${qs.toString()}`, emptyPage<UserRow>()),
    apiFetchOr<CursorPage<OrganizationRow>>(
      '/organizations?limit=100',
      emptyPage<OrganizationRow>(),
    ),
    fetchRoleOptions(),
  ]);

  const orgNameById = new Map(orgsPage.items.map((o) => [o.id, o.name]));
  const roleLabelById = new Map(roles.map((r) => [r.id, r.label]));
  const rows = applyClientSideView(usersPage.items, { status, query, sort });
  const activeCount = usersPage.items.filter((u) => u.isActive).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-leaf-700 dark:text-leaf-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Administration
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Utilisateurs
            </h1>
            <Badge variant="secondary">{usersPage.items.length}</Badge>
          </div>
          <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Créez les comptes, attribuez les rôles et gérez l&apos;accès à la plateforme.{' '}
            {activeCount} actif{activeCount > 1 ? 's' : ''} sur {usersPage.items.length}.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/users/new">
            <UserPlus className="h-4 w-4" />
            Nouvel utilisateur
          </Link>
        </Button>
      </header>

      {params.created && (
        <SuccessBanner>Utilisateur créé. E-mail d&apos;activation envoyé.</SuccessBanner>
      )}
      {params.updated && <SuccessBanner>Modifications enregistrées.</SuccessBanner>}

      <UsersToolbar role={role} status={status} sort={sort} query={query} roles={roles} />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
                <Th>Utilisateur</Th>
                <Th>Rôle</Th>
                <Th>Organisation</Th>
                <Th>Statut</Th>
                <Th>Dernière connexion</Th>
                <Th>Créé le</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
              {rows.map((u) => (
                <tr
                  key={u.id}
                  className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={roleVariant(u.roleId)}>
                      {roleLabelById.get(u.roleId) ?? u.roleId}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {u.organizationId ? (orgNameById.get(u.organizationId) ?? '—') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive ? (
                      <Badge variant="success">Actif</Badge>
                    ) : (
                      <Badge variant="secondary">Inactif</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {formatDate(u.lastLoginAt)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end">
                      <UserActionsMenu
                        userId={u.id}
                        isActive={u.isActive}
                        fullName={`${u.firstName} ${u.lastName}`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    {usersPage.items.length === 0
                      ? 'Aucun utilisateur. Créez le premier compte.'
                      : 'Aucun utilisateur ne correspond à ces filtres.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SuccessBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th scope="col" className={`px-4 py-2.5 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );
}
