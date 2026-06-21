'use client';

import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';
import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Champ mot de passe avec bouton afficher/masquer (icône œil).
 * Accepte les mêmes props qu'`Input` (hors `type`, géré en interne).
 */
export const PasswordInput = React.forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  ({ className, disabled, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          disabled={disabled}
          className={cn('pr-10', className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-pressed={visible}
          className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-r-lg text-zinc-400 transition-colors hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-zinc-200"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
