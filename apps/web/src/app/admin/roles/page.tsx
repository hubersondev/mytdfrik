import { CheckCircle2, Lock, Plus, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetchOr } from '@/lib/api';
import {
  applyClientSideView,
  SCOPE_SHORT,
  scopeKeyFromQuery,
  statusKeyFromQuery,
  type RoleRow,
} from '@/lib/roles';
import { RoleActionsMenu } from './_components/role-actions-menu';
import { RolesToolbar } from './_components/roles-toolbar';

export default async function AdminRolesPage({
  searchParams,
}: {
  searchParams: Promise<{
    scope?: string;
    status?: string;
    q?: string;
    created?: string;
    updated?: string;
  }>;
}) {
  const params = await searchParams;
  const scope = scopeKeyFromQuery(params.scope);
  const status = statusKeyFromQuery(params.status);
  const query = params.q ?? '';

  // Le filtre scope est délégué à l'API ; statut + recherche en mémoire.
  const qs = new URLSearchParams();
  if (scope !== 'ALL') qs.set('scope', scope);
  const all = await apiFetchOr<RoleRow[]>(`/roles${qs.toString() ? `?${qs.toString()}` : ''}`, []);
  const rows = applyClientSideView(all, { status, query });

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
              Rôles &amp; permissions
            </h1>
            <Badge variant="secondary">{all.length}</Badge>
          </div>
          <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Définissez les rôles de chaque portail et les permissions qui leur sont attribuées. Le
            rôle Administrateur dispose de tous les droits et n&apos;est pas modifiable.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/roles/new">
            <Plus className="h-4 w-4" />
            Nouveau rôle
          </Link>
        </Button>
      </header>

      {params.created && <SuccessBanner>Rôle créé.</SuccessBanner>}
      {params.updated && <SuccessBanner>Modifications enregistrées.</SuccessBanner>}

      <RolesToolbar scope={scope} status={status} query={query} />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
                <Th>Rôle</Th>
                <Th>Portail</Th>
                <Th>Permissions</Th>
                <Th>Comptes</Th>
                <Th>Statut</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">{r.label}</p>
                      {r.isSystem && (
                        <span
                          className="inline-flex items-center gap-1 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                          title="Rôle système non supprimable"
                        >
                          <Lock className="h-3 w-3" />
                          Système
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{r.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={r.scope === 'INTERNAL' ? 'leaf' : 'brand'}>
                      {SCOPE_SHORT[r.scope]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {r.isSystem ? (
                      <span className="text-zinc-500 dark:text-zinc-400">Toutes</span>
                    ) : (
                      `${r.permissions.length}`
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-zinc-400" />
                      {r.userCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.isActive ? (
                      <Badge variant="success">Actif</Badge>
                    ) : (
                      <Badge variant="secondary">Inactif</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end">
                      <RoleActionsMenu roleId={r.id} label={r.label} isSystem={r.isSystem} />
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    {all.length === 0 ? 'Aucun rôle.' : 'Aucun rôle ne correspond à ces filtres.'}
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
