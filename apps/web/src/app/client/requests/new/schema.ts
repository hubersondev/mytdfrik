import { z } from 'zod';

/**
 * Schéma de validation du formulaire de soumission Client (CDC §3.4 [EXG-03-021..028]).
 *
 * Doublé de la validation côté API (`class-validator` sur CreateRequestDto) ;
 * ici on couvre l'expérience utilisateur immédiate. Les libellés d'erreur sont
 * affichés tels quels dans l'UI — rédigés en clair pour un Client final.
 */
export const createRequestSchema = z.object({
  categoryId: z.string().uuid({ message: 'Sélectionnez une catégorie dans la liste.' }),
  title: z
    .string()
    .trim()
    .min(8, { message: 'Le titre doit faire au moins 8 caractères.' })
    .max(200, { message: 'Le titre est limité à 200 caractères.' }),
  description: z
    .string()
    .trim()
    .min(20, { message: 'Décrivez votre demande en au moins 20 caractères.' })
    .max(5000, { message: 'La description ne peut pas dépasser 5000 caractères.' }),
  impact: z.enum(['BLOCAGE_TOTAL', 'BLOCAGE_PARTIEL', 'DEGRADATION', 'AUCUN_IMPACT'], {
    message: "Sélectionnez un niveau d'impact.",
  }),
  urgency: z.enum(['CRITIQUE', 'ELEVEE', 'MODEREE', 'FAIBLE'], {
    message: "Sélectionnez un niveau d'urgence.",
  }),
  clientContextNote: z
    .string()
    .trim()
    .max(500, { message: 'Le contexte additionnel est limité à 500 caractères.' })
    .optional()
    .or(z.literal('')),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
