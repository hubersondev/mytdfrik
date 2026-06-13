import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-shadow placeholder:text-zinc-400 focus-visible:border-leaf-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:focus-visible:border-leaf-500 dark:focus-visible:ring-leaf-500/30',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
