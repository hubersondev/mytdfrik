import { ArrowLeft, CheckCircle2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { paginate, resolvePageSize } from '@/lib/paginate';
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
import { ExportUsersButton, type ExportRow } from './_components/export-users-button';
import { UserRowActions } from './_components/user-row-actions';
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

/** Initiales (serveur-safe — la version client vit dans le composant Avatar). */
function initialsOf(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string;
    status?: string;
    sort?: string;
    q?: string;
    page?: string;
    size?: string;
    created?: string;
    updated?: string;
  }>;
}) {
  const params = await searchParams;
  const role = roleKeyFromQuery(params.role);
  const status = statusKeyFromQuery(params.status);
  const sort = sortKeyFromQuery(params.sort);
  const query = params.q ?? '';
  const PAGE_SIZE = resolvePageSize(params.size);

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
  const { pageItems, safePage } = paginate(rows, Number(params.page) || 1, PAGE_SIZE);
  const total = usersPage.items.length;
  const activeCount = usersPage.items.filter((u) => u.isActive).length;
  const inactiveCount = total - activeCount;

  const exportRows: ExportRow[] = rows.map((u) => ({
    name: `${u.firstName} ${u.lastName}`,
    email: u.email,
    role: roleLabelById.get(u.roleId) ?? u.roleId,
    status: u.isActive ? 'Actif' : 'Inactif',
    lastLogin: formatDate(u.lastLoginAt),
    createdAt: formatDate(u.createdAt),
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Fil d'Ariane + retour */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour au tableau de bord
      </Link>

      {/* Titre + actions */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Gestion des utilisateurs
        </h1>
        <div className="flex items-center gap-2">
          <ExportUsersButton rows={exportRows} />
          <Button asChild size="sm">
            <Link href="/admin/users/new">
              <UserPlus className="h-4 w-4" />
              Nouvel utilisateur
            </Link>
          </Button>
        </div>
      </header>

      {/* Cartes-statistiques */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard value={total} label="Utilisateurs" />
        <StatCard value={activeCount} label="Actifs" tone="leaf" />
        <StatCard value={inactiveCount} label="Inactifs" tone="zinc" />
        <StatCard value={roles.length} label="Rôles" />
      </section>

      {params.created && (
        <SuccessBanner>Utilisateur créé. E-mail d&apos;activation envoyé.</SuccessBanner>
      )}
      {params.updated && <SuccessBanner>Modifications enregistrées.</SuccessBanner>}

      {/* Carte : recherche/filtres + tableau */}
      <Card className="overflow-hidden">
        <div className="border-b border-zinc-200/70 p-4 dark:border-zinc-800">
          <UsersToolbar role={role} status={status} sort={sort} query={query} roles={roles} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200/80 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <Th>Nom</Th>
                <Th>E-mail</Th>
                <Th>Rôle</Th>
                <Th>Organisation</Th>
                <Th>Statut</Th>
                <Th>Dernière connexion</Th>
                <Th>Créé le</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/80">
              {pageItems.map((u) => (
                <tr
                  key={u.id}
                  className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-leaf-100 text-xs font-semibold text-leaf-700 dark:bg-leaf-950 dark:text-leaf-300">
                          {initialsOf(u.firstName, u.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {u.firstName} {u.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {u.email}
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
                    <StatusPill active={u.isActive} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDate(u.lastLoginAt)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <UserRowActions
                      userId={u.id}
                      isActive={u.isActive}
                      fullName={`${u.firstName} ${u.lastName}`}
                    />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    {total === 0
                      ? 'Aucun utilisateur. Créez le premier compte.'
                      : 'Aucun utilisateur ne correspond à ces filtres.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={safePage} pageSize={PAGE_SIZE} total={rows.length} />
      </Card>
    </div>
  );
}

function StatCard({
  value,
  label,
  tone = 'default',
}: {
  value: number;
  label: string;
  tone?: 'default' | 'leaf' | 'zinc';
}) {
  const valueClass = {
    default: 'text-zinc-900 dark:text-zinc-50',
    leaf: 'text-leaf-700 dark:text-leaf-400',
    zinc: 'text-zinc-400 dark:text-zinc-500',
  }[tone];
  return (
    <Card className="p-5">
      <p className={`text-3xl font-bold tracking-tight ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
    </Card>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
          : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
      {active ? 'Actif' : 'Inactif'}
    </span>
  );
}

function SuccessBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
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
