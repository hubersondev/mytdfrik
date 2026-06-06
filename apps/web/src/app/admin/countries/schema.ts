import { z } from 'zod';

/**
 * Schéma de validation du formulaire pays (création + édition).
 * Doublé de la validation API (`class-validator` sur CreateCountryDto).
 */
export const countryFormSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, { message: 'Code ISO à 2 lettres (ex. CI, FR, SN).' }),
  name: z
    .string()
    .trim()
    .min(2, { message: 'Le nom du pays doit faire au moins 2 caractères.' })
    .max(80, { message: 'Le nom est limité à 80 caractères.' }),
  isActive: z.boolean(),
});

export type CountryFormInput = z.infer<typeof countryFormSchema>;
