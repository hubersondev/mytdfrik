import { z } from 'zod';

/**
 * Schéma du formulaire rôle. `code` et `scope` ne sont saisis qu'à la création
 * (immuables ensuite — voir composant). La validation des codes de permissions
 * contre le catalogue est faite côté API.
 */
export const roleFormSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z][A-Z0-9_]*$/, {
      message: 'Code en MAJUSCULES (lettres, chiffres, underscores), commençant par une lettre.',
    })
    .min(2, { message: 'Le code doit faire au moins 2 caractères.' })
    .max(20, { message: 'Le code est limité à 20 caractères.' }),
  label: z
    .string()
    .trim()
    .min(2, { message: 'Le libellé doit faire au moins 2 caractères.' })
    .max(80, { message: 'Le libellé est limité à 80 caractères.' }),
  description: z
    .string()
    .trim()
    .max(2000, { message: 'La description est limitée à 2000 caractères.' })
    .optional()
    .or(z.literal('')),
  scope: z.enum(['INTERNAL', 'CLIENT'], { message: 'Sélectionnez un portail.' }),
  isActive: z.boolean(),
  permissions: z.array(z.string()),
});

export type RoleFormInput = z.infer<typeof roleFormSchema>;
