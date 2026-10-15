import { z } from 'zod';

export const fundingSchema = z.object({
  amount: z.number().positive('Le montant doit être supérieur à zéro.'),
  date_sent: z.date(),
  date_expected: z.date().optional(),
  funder_id: z.string().trim().min(1, 'Sélectionnez un financeur.'),
  description: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'received']),
});

export type FundingFormData = z.infer<typeof fundingSchema>;
