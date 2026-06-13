import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { apiFetchOr } from '@/lib/api';
import type { ProductOption } from '@/lib/bug';
import type { CategoryOption } from '@/lib/requests';
import { CreateRequestForm } from './_components/create-request-form';

interface CursorPage<T> {
  items: T[];
  page_info: { has_next: boolean; next_cursor: string | null };
}

function emptyPage<T>(): CursorPage<T> {
  return { items: [], page_info: { has_next: false, next_cursor: null } };
}

export const metadata = {
  title: 'Nouvelle demande · MyTDFRIK',
};

export default async function NewRequestPage() {
  const [catPage, prodPage] = await Promise.all([
    apiFetchOr<CursorPage<CategoryOption>>('/categories?limit=100', emptyPage<CategoryOption>()),
    apiFetchOr<CursorPage<ProductOption>>(
      '/products?active_only=true&limit=100',
      emptyPage<ProductOption>(),
    ),
  ]);
  const categories = catPage.items.filter((c) => c.isActive);
  const products = prodPage.items.filter((p) => p.isActive);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-leaf-700 dark:text-leaf-400">
          <PlusCircle className="h-3.5 w-3.5" />
          Nouvelle demande
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Soumettre une demande à TECHDIFRIK
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Le formulaire en quatre étapes vous guide jusqu&apos;à la soumission. Vous pourrez ensuite
          suivre l&apos;avancement de votre demande depuis votre espace.{' '}
          <Link
            href="/client/requests"
            className="font-medium text-leaf-700 hover:underline dark:text-leaf-400"
          >
            Voir mes demandes
          </Link>
          .
        </p>
      </header>

      <CreateRequestForm categories={categories} products={products} />
    </div>
  );
}
