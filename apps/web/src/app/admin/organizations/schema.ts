import { z } from 'zod';

/**
 * Schéma de validation du formulaire organisation (création + édition).
 *
 * Doublé de la validation côté API (`class-validator` sur CreateOrganizationDto) ;
 * ici on couvre l'expérience immédiate de l'Administrateur.
 */
export const organizationFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: "Le nom de l'organisation doit faire au moins 2 caractères." })
      .max(200, { message: 'Le nom est limité à 200 caractères.' }),
    externalReference: z
      .string()
      .trim()
      .max(80, { message: 'La référence externe est limitée à 80 caractères.' })
      .optional()
      .or(z.literal('')),
    addressLine: z
      .string()
      .trim()
      .max(200, { message: "L'adresse est limitée à 200 caractères." })
      .optional()
      .or(z.literal('')),
    countryId: z
      .string()
      .uuid({ message: 'Sélectionnez un pays valide.' })
      .optional()
      .or(z.literal('')),
    cityId: z
      .string()
      .uuid({ message: 'Sélectionnez une ville valide.' })
      .optional()
      .or(z.literal('')),
    primaryContactEmail: z
      .string()
      .trim()
      .email({ message: 'Adresse e-mail invalide.' })
      .max(254, { message: "L'adresse e-mail est limitée à 254 caractères." })
      .optional()
      .or(z.literal('')),
    isActive: z.boolean(),
  })
  .refine((data) => !data.cityId || Boolean(data.countryId), {
    message: "Sélectionnez d'abord un pays.",
    path: ['cityId'],
  });

export type OrganizationFormInput = z.infer<typeof organizationFormSchema>;
