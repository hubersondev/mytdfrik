import { ArrowLeft, Boxes } from 'lucide-react';
import Link from 'next/link';
import { ProductForm } from '../_components/product-form';

export const metadata = { title: 'Nouveau produit · MyTDFRIK' };

export default function NewProductPage() {
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
            <Boxes className="h-5 w-5" />
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Nouveau produit
          </h1>
        </div>
      </div>

      <ProductForm mode="create" />
    </div>
  );
}
