import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { fetchPreferencesAction } from '@/components/notifications/actions';
import { PreferencesForm } from '@/components/notifications/preferences-form';
import { preferenceCategoriesFor } from '@/lib/notifications';

export const metadata = { title: 'Préférences de notification · MyTDFRIK' };

export default async function ClientNotificationPreferencesPage() {
  const initial = await fetchPreferencesAction();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/client/notifications"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour aux notifications
        </Link>
      </div>
      <header className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-leaf-700 dark:text-leaf-400" />
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Préférences de notification
        </h1>
      </header>
      <PreferencesForm categories={preferenceCategoriesFor('client')} initial={initial} />
    </div>
  );
}
