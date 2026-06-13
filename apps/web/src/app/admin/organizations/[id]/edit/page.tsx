import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, apiFetchOr } from '@/lib/api';
import type { CityRow, CountryRow, CursorPage } from '@/lib/geo';
import type { OrganizationRow } from '@/lib/organizations';
import { OrganizationForm } from '../../_components/organization-form';

function emptyPage<T>(): CursorPage<T> {
  return { items: [], page_info: { has_next: false, next_cursor: null } };
}

export default async function EditOrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let org: OrganizationRow;
  try {
    org = await apiFetch<OrganizationRow>(`/organizations/${id}`);
  } catch (error) {
    if ((error as { status?: number })?.status === 404) notFound();
    throw error;
  }

  const [countries, cities] = await Promise.all([
    apiFetchOr<CursorPage<CountryRow>>(
      '/countries?limit=100&active_only=true',
      emptyPage<CountryRow>(),
    ),
    apiFetchOr<CursorPage<CityRow>>('/cities?limit=100', emptyPage<CityRow>()),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/organizations"
          className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux organisations
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-leaf-50 text-leaf-700 dark:bg-leaf-950/60 dark:text-leaf-300">
            <Pencil className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {org.name}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {[org.city?.name, org.country?.name].filter(Boolean).join(', ') ||
                'Modifier les informations'}
            </p>
          </div>
        </div>
      </div>

      <OrganizationForm
        mode="edit"
        organizationId={org.id}
        countries={countries.items}
        cities={cities.items}
        defaultValues={{
          name: org.name,
          externalReference: org.externalReference ?? '',
          addressLine: org.addressLine ?? '',
          countryId: org.countryId ?? '',
          cityId: org.cityId ?? '',
          primaryContactEmail: org.primaryContactEmail ?? '',
          isActive: org.isActive,
        }}
      />
    </div>
  );
}
