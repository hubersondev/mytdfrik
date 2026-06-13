import { UserCircle } from 'lucide-react';
import { ChangePasswordForm } from '@/components/profile/change-password-form';
import { ProfileForm } from '@/components/profile/profile-form';
import { apiFetch } from '@/lib/api';

interface Me {
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  roleId: string;
  timeZone: string;
}

export const metadata = { title: 'Mon profil · MyTDFRIK' };

export default async function ClientProfilePage() {
  const me = await apiFetch<Me>('/users/me');
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-leaf-50 text-leaf-700 dark:bg-leaf-950/60 dark:text-leaf-300">
          <UserCircle className="h-5 w-5" />
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Mon profil
        </h1>
      </header>

      <ProfileForm
        email={me.email}
        roleLabel={me.roleId}
        defaultValues={{
          firstName: me.firstName,
          lastName: me.lastName,
          phone: me.phone ?? '',
          timeZone: me.timeZone,
        }}
      />
      <ChangePasswordForm />
    </div>
  );
}
