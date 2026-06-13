import { z } from 'zod';

/** Schéma d'édition d'un niveau de priorité (SLA). L'id (P0-P4) n'est pas modifiable. */
export const priorityFormSchema = z.object({
  label: z
    .string()
    .trim()
    .min(2, { message: 'Le libellé est requis.' })
    .max(40, { message: 'Le libellé est limité à 40 caractères.' }),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  slaFirstResponseMinutes: z
    .number({ message: 'Indiquez un délai en minutes.' })
    .int()
    .min(1, { message: 'Au moins 1 minute.' }),
  slaResolutionMinutes: z
    .number({ message: 'Indiquez un délai en minutes.' })
    .int()
    .min(1, { message: 'Au moins 1 minute.' }),
  is24x7: z.boolean(),
});

export type PriorityFormInput = z.infer<typeof priorityFormSchema>;
