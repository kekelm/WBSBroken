import { z } from 'zod';

/**
 * Zod schema for LaborCategory validation
 */
export const LaborCategorySchema = z.object({
  id: z.string().uuid(),
  laborCategoryName: z.string().min(1, { message: "Labor Category Name is required" }),
  currency: z.object({ id: z.string().uuid(), currencyName: z.string() }).optional(),
  exchangeRate: z.number().optional(),
  laborBillRate: z.number(),
  laborBillRateBase: z.number().optional(),
  laborCostRate: z.number(),
  laborCostRateBase: z.number().optional(),
});

/**
 * Schema for creating a new LaborCategory (omits system-generated ID)
 */
export const CreateLaborCategorySchema = LaborCategorySchema.omit({ id: true });

/**
 * Schema for updating an existing LaborCategory
 */
export const UpdateLaborCategorySchema = LaborCategorySchema;

export type LaborCategoryInput = z.infer<typeof LaborCategorySchema>;
export type CreateLaborCategoryInput = z.infer<typeof CreateLaborCategorySchema>;
export type UpdateLaborCategoryInput = z.infer<typeof UpdateLaborCategorySchema>;