import { z } from 'zod';

/** Schéma du formulaire produit (création + édition). Doublé de l'API. */
export const productFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, { message: 'Le code doit faire au moins 2 caractères.' })
    .max(40, { message: 'Le code est limité à 40 caractères.' })
    .regex(/^[A-Z][A-Z0-9_]*$/, {
      message: 'MAJUSCULES, chiffres et underscores, commençant par une lettre.',
    }),
  label: z
    .string()
    .trim()
    .min(2, { message: 'Le libellé est requis.' })
    .max(160, { message: 'Le libellé est limité à 160 caractères.' }),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  defaultOwnerTeam: z.string().trim().max(80).optional().or(z.literal('')),
  requiresOs: z.boolean(),
  requiresBrowser: z.boolean(),
  isActive: z.boolean(),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;
