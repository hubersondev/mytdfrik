'use server';

import { revalidatePath } from 'next/cache';
import { setSidebarCollapsed } from '@/lib/sidebar';

export async function toggleSidebarAction(nextCollapsed: boolean): Promise<void> {
  await setSidebarCollapsed(nextCollapsed);
  // Re-rendu du layout pour appliquer la nouvelle largeur côté serveur.
  revalidatePath('/admin', 'layout');
}
