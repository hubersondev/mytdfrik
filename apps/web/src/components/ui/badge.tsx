import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium uppercase tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900',
        secondary: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
        outline: 'border border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300',
        success: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
        warning: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300',
        danger: 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300',
        /** Identité TECHDIFRIK — orange brand (extrait du mot "TECH"). */
        brand: 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300',
        /** Identité TECHDIFRIK — vert leaf (extrait du mot "DIFRIK"). */
        leaf: 'bg-leaf-100 text-leaf-800 dark:bg-leaf-950 dark:text-leaf-300',
        /** Identité TECHDIFRIK — or sand (extrait de la silhouette Afrique). */
        sand: 'bg-sand-100 text-sand-900 dark:bg-sand-950 dark:text-sand-300',
      },
    },
    defaultVariants: { variant: 'secondary' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** Couleur de badge associée à une priorité MyTDFRIK (CDC §5.3). */
export function priorityVariant(
  code: 'P0' | 'P1' | 'P2' | 'P3' | 'P4',
): NonNullable<BadgeProps['variant']> {
  switch (code) {
    case 'P0':
      return 'danger';
    case 'P1':
      return 'warning';
    case 'P2':
      return 'warning';
    case 'P3':
      return 'brand';
    case 'P4':
      return 'secondary';
  }
}
