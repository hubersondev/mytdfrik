import { z } from 'zod';

/**
 * Schéma de validation du formulaire utilisateur (création + édition).
 *
 * Doublé de la validation côté API (`class-validator` sur CreateUserDto). Le
 * `roleId` est un code de rôle dynamique (ADR-004), validé pour la forme ici ;
 * son existence et la règle « rôle de portée Client ⇒ organisation requise »
 * sont vérifiées côté API. La règle d'organisation est aussi appliquée dans le
 * formulaire (selon le scope du rôle sélectionné) pour un retour immédiat.
 */
export const userFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, { message: 'Le prénom est requis.' })
    .max(120, { message: 'Le prénom est limité à 120 caractères.' }),
  lastName: z
    .string()
    .trim()
    .min(1, { message: 'Le nom est requis.' })
    .max(120, { message: 'Le nom est limité à 120 caractères.' }),
  email: z
    .string()
    .trim()
    .min(1, { message: "L'adresse e-mail est requise." })
    .email({ message: 'Adresse e-mail invalide.' })
    .max(254, { message: "L'adresse e-mail est limitée à 254 caractères." }),
  roleId: z.string().trim().min(1, { message: 'Sélectionnez un rôle.' }),
  organizationId: z
    .string()
    .uuid({ message: 'Sélectionnez une organisation valide.' })
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .trim()
    .max(40, { message: 'Le téléphone est limité à 40 caractères.' })
    .optional()
    .or(z.literal('')),
  timeZone: z
    .string()
    .trim()
    .max(64, { message: 'Le fuseau horaire est limité à 64 caractères.' })
    .optional()
    .or(z.literal('')),
});

export type UserFormInput = z.infer<typeof userFormSchema>;
