'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { priorityFormSchema, type PriorityFormInput } from './schema';

export interface PriorityFormFailure {
  ok: false;
  fieldErrors: Partial<Record<keyof PriorityFormInput, string>>;
  formError?: string;
}

export async function updatePriorityAction(
  id: string,
  input: PriorityFormInput,
): Promise<PriorityFormFailure | never> {
  const parsed = priorityFormSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: PriorityFormFailure['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') {
        fieldErrors[key as keyof PriorityFormInput] = issue.message;
      }
    }
    return { ok: false, fieldErrors };
  }
  try {
    await apiFetch(`/priority-levels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        label: parsed.data.label,
        description: parsed.data.description?.trim() || undefined,
        slaFirstResponseMinutes: parsed.data.slaFirstResponseMinutes,
        slaResolutionMinutes: parsed.data.slaResolutionMinutes,
        is24x7: parsed.data.is24x7,
      }),
    });
  } catch (error) {
    return {
      ok: false,
      fieldErrors: {},
      formError:
        (error as { message?: string })?.message ?? 'Une erreur est survenue. Veuillez réessayer.',
    };
  }
  revalidatePath('/admin/priorities');
  redirect('/admin/priorities?updated=1');
}
