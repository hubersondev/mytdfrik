'use server';

import { revalidatePath } from 'next/cache';
import { setSidebarCollapsed } from '@/lib/sidebar';

export async function toggleClientSidebarAction(nextCollapsed: boolean): Promise<void> {
  await setSidebarCollapsed(nextCollapsed);
  revalidatePath('/client', 'layout');
}
