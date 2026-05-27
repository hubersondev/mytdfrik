import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-zinc-950',
  {
    variants: {
      variant: {
        /** CTA principal — vert leaf TECHDIFRIK (couleur primary de l'identité). */
        default:
          'bg-leaf-700 text-white hover:bg-leaf-800 focus-visible:ring-leaf-700 dark:bg-leaf-600 dark:hover:bg-leaf-500',
        /** CTA secondaire identitaire — orange brand. Réservé aux highlights marketing. */
        brand:
          'bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-brand-500 dark:hover:bg-brand-400',
        /** Action neutre forte — pour les boutons "valider" ou actions non identitaires. */
        neutral:
          'bg-zinc-900 text-zinc-50 hover:bg-zinc-800 focus-visible:ring-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-100',
        outline:
          'border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 focus-visible:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900 dark:focus-visible:ring-zinc-700',
        ghost:
          'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-zinc-300 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-700',
        destructive: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8',
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
