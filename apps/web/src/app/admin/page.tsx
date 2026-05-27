import {
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Download,
  Plus,
  ShieldCheck,
  Sparkles,
  Tags,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Badge, priorityVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { apiFetchOr } from '@/lib/api';

interface CursorPage<T> {
  items: T[];
  page_info: { has_next: boolean; next_cursor: string | null };
}

interface CategoryRow {
  id: string;
  code: string;
  label: string;
  defaultPriorityId: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  isActive: boolean;
}
interface ProductRow {
  id: string;
  code: string;
  label: string;
  isActive: boolean;
}
interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}
interface PriorityLevelRow {
  id: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  label: string;
  slaFirstResponseMinutes: number;
  slaResolutionMinutes: number;
  is24x7: boolean;
}

export default async function AdminDashboard() {
  const [categories, products, users, priorities] = await Promise.all([
    apiFetchOr<CursorPage<CategoryRow>>('/categories?limit=100', emptyPage<CategoryRow>()),
    apiFetchOr<CursorPage<ProductRow>>('/products?limit=100', emptyPage<ProductRow>()),
    apiFetchOr<CursorPage<UserRow>>('/users?limit=100', emptyPage<UserRow>()),
    apiFetchOr<PriorityLevelRow[]>('/priority-levels', []),
  ]);

  const stats = [
    {
      label: 'Catégories',
      value: categories.items.length,
      sub: `${activeCount(categories.items)} actives`,
      icon: Tags,
      href: '/admin/categories',
      tone: 'brand' as const,
    },
    {
      label: 'Produits',
      value: products.items.length,
      sub: `${activeCount(products.items)} actifs`,
      icon: Boxes,
      href: '/admin/categories',
      tone: 'leaf' as const,
    },
    {
      label: 'Utilisateurs',
      value: users.items.length,
      sub: `${activeCount(users.items)} actifs`,
      icon: Users,
      href: '/admin/categories',
      tone: 'sand' as const,
    },
    {
      label: 'Priorités',
      value: priorities.length,
      sub: priorities.some((p) => p.is24x7) ? 'P0 en 24/7' : 'paramétrables',
      icon: Sparkles,
      href: '/admin/categories',
      tone: 'zinc' as const,
    },
  ];

  const topCategories = [...categories.items]
    .sort((a, b) => a.defaultPriorityId.localeCompare(b.defaultPriorityId))
    .slice(0, 5);

  const recentUsers = [...users.items]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-leaf-700 dark:text-leaf-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Administration
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Paramétrage de la plateforme
          </h1>
          <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Utilisateurs, droits d&apos;accès, catégories de demandes et règles métier.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Audit log
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nouvel utilisateur
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatTile
            key={stat.label}
            label={stat.label}
            value={stat.value}
            sub={stat.sub}
            icon={stat.icon}
            href={stat.href}
            tone={stat.tone}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Catégories prioritaires
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Top 5 par priorité par défaut · CDC annexe A3
              </p>
            </div>
            <Link
              href="/admin/categories"
              className="flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Voir tout
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <Separator />
          <ul className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
            {topCategories.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <Badge variant={priorityVariant(c.defaultPriorityId)}>{c.defaultPriorityId}</Badge>
                <span className="flex-1 truncate text-zinc-900 dark:text-zinc-100">{c.label}</span>
                <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{c.code}</span>
              </li>
            ))}
            {topCategories.length === 0 && (
              <li className="px-5 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Aucune catégorie configurée.
              </li>
            )}
          </ul>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Comptes récents
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Derniers utilisateurs créés
              </p>
            </div>
          </div>
          <Separator />
          <ul className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
            {recentUsers.map((u) => (
              <li key={u.id} className="px-5 py-3 text-sm">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {u.firstName} {u.lastName}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{u.email}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge variant="outline">{u.roleId}</Badge>
                  {u.isActive ? (
                    <Badge variant="success">Actif</Badge>
                  ) : (
                    <Badge variant="secondary">Inactif</Badge>
                  )}
                </div>
              </li>
            ))}
            {recentUsers.length === 0 && (
              <li className="px-5 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Aucun utilisateur.
              </li>
            )}
          </ul>
        </Card>
      </section>

      <Card>
        <div className="flex items-center gap-2 p-5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            État du Sprint 2 — Catalogue &amp; Administration
          </p>
        </div>
        <Separator />
        <ul className="space-y-1.5 px-5 py-4 text-sm text-zinc-700 dark:text-zinc-300">
          <ChecklistItem checked>14 catégories du CDC annexe A3 seedées</ChecklistItem>
          <ChecklistItem checked>5 niveaux de priorité paramétrables (SLA)</ChecklistItem>
          <ChecklistItem checked>
            CRUD complet exposé via API (Categories, Products, Users, Organizations)
          </ChecklistItem>
          <ChecklistItem checked>RBAC appliqué : ADMIN requis pour les écritures</ChecklistItem>
          <ChecklistItem>
            Formulaires CRUD côté frontend — arrivent dans les sprints suivants
          </ChecklistItem>
        </ul>
      </Card>
    </div>
  );
}

type Tone = 'brand' | 'leaf' | 'sand' | 'zinc';

const TILE_TONE_ICON: Record<Tone, string> = {
  leaf: 'bg-leaf-50 text-leaf-700 dark:bg-leaf-950/60 dark:text-leaf-300',
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300',
  sand: 'bg-sand-100 text-sand-800 dark:bg-sand-950/60 dark:text-sand-300',
  zinc: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
};

function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  href,
  tone,
}: {
  label: string;
  value: number;
  sub: string;
  icon: LucideIcon;
  href: string;
  tone: Tone;
}) {
  return (
    <Link href={href} className="group">
      <Card className="h-full bg-white transition-colors group-hover:border-leaf-300 dark:bg-zinc-900/50 dark:group-hover:border-leaf-800">
        <div className="flex h-full flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {label}
            </p>
            <span className={`grid h-8 w-8 place-items-center rounded-lg ${TILE_TONE_ICON[tone]}`}>
              <Icon className="h-4 w-4" />
            </span>
          </div>
          <p className="text-4xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {value}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>
        </div>
      </Card>
    </Link>
  );
}

function ChecklistItem({ checked, children }: { checked?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={
          checked
            ? 'mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500'
            : 'mt-1 inline-block h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700'
        }
      />
      <span className={checked ? '' : 'text-zinc-500 dark:text-zinc-400'}>{children}</span>
    </li>
  );
}

function activeCount(items: { isActive: boolean }[]): number {
  return items.filter((i) => i.isActive).length;
}

function emptyPage<T>(): CursorPage<T> {
  return { items: [], page_info: { has_next: false, next_cursor: null } };
}
