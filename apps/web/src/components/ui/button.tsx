import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
  {
    variants: {
      variant: {
        /** CTA principal — dégradé vert leaf TECHDIFRIK (couleur primary de l'identité). */
        default:
          'bg-gradient-to-b from-leaf-600 to-leaf-700 text-white shadow-sm hover:from-leaf-500 hover:to-leaf-600 hover:shadow-md focus-visible:ring-leaf-600 dark:from-leaf-600 dark:to-leaf-700 dark:hover:from-leaf-500 dark:hover:to-leaf-600',
        /** CTA secondaire identitaire — orange brand. Réservé aux highlights marketing. */
        brand:
          'bg-gradient-to-b from-brand-400 to-brand-500 text-white shadow-sm hover:from-brand-500 hover:to-brand-600 hover:shadow-md focus-visible:ring-brand-500',
        /** Action neutre forte — pour les boutons "valider" ou actions non identitaires. */
        neutral:
          'bg-zinc-900 text-zinc-50 shadow-sm hover:bg-zinc-800 hover:shadow-md focus-visible:ring-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-100',
        outline:
          'border border-zinc-200 bg-white/80 text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 focus-visible:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-100 dark:hover:bg-zinc-900 dark:focus-visible:ring-zinc-700',
        ghost:
          'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-zinc-300 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-700',
        destructive:
          'bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-sm hover:from-rose-600 hover:to-rose-700 hover:shadow-md focus-visible:ring-rose-500',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-lg px-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';
