import { z } from 'zod';

/**
 * Zod schema for Opportunity validation
 */
export const OpportunitySchema = z.object({
  id: z.string().uuid(),
  opportunityID: z.string(),
  architect: z.string().optional(),
  clearanceLevelKey: z.string().optional(),
  currency: z.object({ id: z.string().uuid(), currencyName: z.string() }).optional(),
  duration: z.string().optional(),
  entryType: z.string().optional(),
  exchangeRate: z.number().optional(),
  opportunityName: z.string().min(1, { message: "Opportunity Name is required" }),
  priceToWin: z.number().optional(),
  priceToWinBase: z.number().optional(),
  projectEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  projectStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  pursuitLead: z.string().optional(),
});

/**
 * Schema for creating a new Opportunity (omits system-generated ID)
 */
export const CreateOpportunitySchema = OpportunitySchema.omit({ id: true });

/**
 * Schema for updating an existing Opportunity
 */
export const UpdateOpportunitySchema = OpportunitySchema;

export type OpportunityInput = z.infer<typeof OpportunitySchema>;
export type CreateOpportunityInput = z.infer<typeof CreateOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof UpdateOpportunitySchema>;