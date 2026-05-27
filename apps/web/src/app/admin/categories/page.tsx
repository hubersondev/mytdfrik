import { apiFetch } from '@/lib/api';

interface CategoryRow {
  id: string;
  code: string;
  label: string;
  description: string | null;
  defaultPriorityId: string;
  requiresBugDetails: boolean;
  defaultResponsibleTeam: string | null;
  isActive: boolean;
}

interface CursorPage<T> {
  items: T[];
  page_info: { has_next: boolean; next_cursor: string | null };
}

const PRIORITY_BADGE: Record<string, string> = {
  P0: 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-100',
  P1: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100',
  P2: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
  P3: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100',
  P4: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
};

export default async function CategoriesPage() {
  const page = await apiFetch<CursorPage<CategoryRow>>('/categories?limit=100');
  const items = [...page.items].sort((a, b) => {
    if (a.defaultPriorityId !== b.defaultPriorityId) {
      return a.defaultPriorityId.localeCompare(b.defaultPriorityId);
    }
    return a.code.localeCompare(b.code);
  });

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Catalogue de catégories
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {page.items.length} catégorie{page.items.length > 1 ? 's' : ''} — CDC annexe A3. Édition
          complète via API (CRUD admin disponible en S2, UI étendue en S3+).
        </p>
      </header>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-950">
            <tr>
              <Th>Code</Th>
              <Th>Libellé</Th>
              <Th>Priorité par défaut</Th>
              <Th>Bug structuré</Th>
              <Th>Équipe par défaut</Th>
              <Th>Statut</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
            {items.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                <td className="px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                  {c.code}
                </td>
                <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">{c.label}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                      PRIORITY_BADGE[c.defaultPriorityId] ?? ''
                    }`}
                  >
                    {c.defaultPriorityId}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {c.requiresBugDetails ? 'Oui' : '—'}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {c.defaultResponsibleTeam ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                      c.isActive
                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100'
                        : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
    >
      {children}
    </th>
  );
}
