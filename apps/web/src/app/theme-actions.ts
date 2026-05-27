'use server';

import { revalidatePath } from 'next/cache';
import { setTheme, type Theme } from '@/lib/theme';

export async function setThemeAction(theme: Theme): Promise<void> {
  await setTheme(theme);
  // Force le re-rendu du Server Component RootLayout pour que la classe 'dark'
  // soit ajustée sur la balise <html>.
  revalidatePath('/', 'layout');
}
