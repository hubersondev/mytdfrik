import { z } from 'zod';

/**
 * Schéma de validation du formulaire ville (création + édition).
 * Doublé de la validation API (`class-validator` sur CreateCityDto).
 */
export const cityFormSchema = z.object({
  countryId: z.string().uuid({ message: 'Sélectionnez un pays.' }),
  name: z
    .string()
    .trim()
    .min(1, { message: 'Le nom de la ville est requis.' })
    .max(120, { message: 'Le nom est limité à 120 caractères.' }),
  isActive: z.boolean(),
});

export type CityFormInput = z.infer<typeof cityFormSchema>;
