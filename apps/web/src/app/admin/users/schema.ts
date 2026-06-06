import { z } from 'zod';
import { ROLE_IDS } from '@/lib/users';

/**
 * Schéma de validation du formulaire utilisateur (création + édition).
 *
 * Doublé de la validation côté API (`class-validator` sur CreateUserDto) ;
 * ici on couvre l'expérience immédiate de l'Administrateur. La règle métier
 * « un CLIENT doit avoir une organisation » est répliquée (contrainte BD côté
 * API : `role_id <> 'CLIENT' OR organization_id IS NOT NULL`).
 */
export const userFormSchema = z
  .object({
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
    roleId: z.enum(ROLE_IDS, { message: 'Sélectionnez un rôle.' }),
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
  })
  .refine((data) => data.roleId !== 'CLIENT' || Boolean(data.organizationId), {
    message: 'Une organisation est obligatoire pour un compte Client.',
    path: ['organizationId'],
  });

export type UserFormInput = z.infer<typeof userFormSchema>;
