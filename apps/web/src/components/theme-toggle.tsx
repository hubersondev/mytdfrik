'use client';

import { Moon, Sun } from 'lucide-react';
import { useTransition } from 'react';
import { setThemeAction } from '@/app/theme-actions';
import { Button } from '@/components/ui/button';

export function ThemeToggle({ current }: { current: 'light' | 'dark' }) {
  const [pending, startTransition] = useTransition();
  const isDark = current === 'dark';
  const next = isDark ? 'light' : 'dark';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => startTransition(() => setThemeAction(next))}
      aria-label={isDark ? 'Passer en clair' : 'Passer en sombre'}
      disabled={pending}
      className="h-8 w-8 p-0"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
