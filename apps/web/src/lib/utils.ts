import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Fusionne des classes Tailwind avec déduplication intelligente.
 * Convention shadcn/ui — utilisé par tous les composants UI.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
