import { z } from 'zod';
import { FREQUENCY_LABELS } from '@/lib/bug';

/**
 * Sous-schéma des détails d'un bug (CDC §6.2.1). Présent uniquement quand la
 * catégorie sélectionnée porte `requiresBugDetails`. Les obligations
 * conditionnelles liées au produit (OS / navigateur) et la cohérence
 * bloquant ↔ impact sont vérifiées côté composant + serveur (source de vérité).
 */
export const bugDetailsSchema = z
  .object({
    productId: z.string().uuid({ message: 'Sélectionnez le produit concerné.' }),
    productVersion: z
      .string()
      .trim()
      .min(1, { message: 'Indiquez la version du produit.' })
      .max(60, { message: 'Version limitée à 60 caractères.' }),
    expectedBehavior: z
      .string()
      .trim()
      .min(1, { message: 'Décrivez le comportement attendu.' })
      .max(2000),
    observedBehavior: z
      .string()
      .trim()
      .min(1, { message: 'Décrivez le comportement observé.' })
      .max(2000),
    reproductionSteps: z
      .string()
      .trim()
      .min(1, { message: 'Indiquez les étapes de reproduction.' })
      .max(3000),
    occurredAt: z.string().min(1, { message: "Indiquez la date d'apparition." }),
    isRecurrent: z.boolean(),
    frequencyLabel: z.enum(FREQUENCY_LABELS).optional(),
    environmentOs: z.string().trim().max(120).optional().or(z.literal('')),
    environmentBrowser: z.string().trim().max(120).optional().or(z.literal('')),
    environmentHardware: z.string().trim().max(300).optional().or(z.literal('')),
    isBlocking: z.boolean(),
    errorMessages: z.string().trim().max(2000).optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurrent && !data.frequencyLabel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['frequencyLabel'],
        message: 'Indiquez la fréquence pour un bug récurrent.',
      });
    }
  });

export type BugDetailsInput = z.infer<typeof bugDetailsSchema>;

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
  bugDetails: bugDetailsSchema.optional(),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
