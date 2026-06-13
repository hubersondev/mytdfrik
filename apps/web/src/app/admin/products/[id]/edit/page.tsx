import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import type { ProductRow } from '@/lib/products';
import { ProductForm } from '../../_components/product-form';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let product: ProductRow;
  try {
    product = await apiFetch<ProductRow>(`/products/${id}`);
  } catch (error) {
    if ((error as { status?: number })?.status === 404) notFound();
    throw error;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/products"
          className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux produits
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-leaf-50 text-leaf-700 dark:bg-leaf-950/60 dark:text-leaf-300">
            <Pencil className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {product.label}
            </h1>
            <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">{product.code}</p>
          </div>
        </div>
      </div>

      <ProductForm
        mode="edit"
        productId={product.id}
        defaultValues={{
          code: product.code,
          label: product.label,
          description: product.description ?? '',
          defaultOwnerTeam: product.defaultOwnerTeam ?? '',
          requiresOs: product.requiresOs,
          requiresBrowser: product.requiresBrowser,
          isActive: product.isActive,
        }}
      />
    </div>
  );
}
