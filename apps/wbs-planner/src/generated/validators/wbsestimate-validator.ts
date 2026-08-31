import { z } from 'zod';

/**
 * Zod schema for WBSEstimate validation
 */
export const WBSEstimateSchema = z.object({
  id: z.string().uuid(),
  estimateName: z.string().min(1, { message: "Estimate Name is required" }),
  approvalComments: z.string().optional(),
  approvedBy: z.object({ id: z.string().uuid(), resourceName: z.string() }).optional(),
  approvedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  costRate: z.number(),
  costRateBase: z.number().optional(),
  createdBy: z.object({ id: z.string().uuid(), resourceName: z.string() }),
  createdDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created Date is required" }),
  currency: z.object({ id: z.string().uuid(), currencyName: z.string() }).optional(),
  estimateStatusKey: z.enum(['Draft', 'Baselined', 'Revised', 'Archived']),
  exchangeRate: z.number().optional(),
  plannedCost: z.number(),
  plannedCostBase: z.number().optional(),
  plannedHours: z.number(),
  project: z.object({ id: z.string().uuid(), projectName: z.string() }),
  resource: z.object({ id: z.string().uuid(), resourceName: z.string() }),
  timePeriod: z.object({ id: z.string().uuid(), timePeriodName: z.string() }),
  wBSItem: z.object({ id: z.string().uuid(), wBSItemName: z.string() }),
});

/**
 * Schema for creating a new WBSEstimate (omits system-generated ID)
 */
export const CreateWBSEstimateSchema = WBSEstimateSchema.omit({ id: true });

/**
 * Schema for updating an existing WBSEstimate
 */
export const UpdateWBSEstimateSchema = WBSEstimateSchema;

export type WBSEstimateInput = z.infer<typeof WBSEstimateSchema>;
export type CreateWBSEstimateInput = z.infer<typeof CreateWBSEstimateSchema>;
export type UpdateWBSEstimateInput = z.infer<typeof UpdateWBSEstimateSchema>;