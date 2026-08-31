import { z } from 'zod';

/**
 * Zod schema for ResourceHourEntry validation
 */
export const ResourceHourEntrySchema = z.object({
  id: z.string().uuid(),
  entryName: z.string().min(1, { message: "Entry Name is required" }),
  actualCost: z.number(),
  actualCostBase: z.number().optional(),
  actualHours: z.number(),
  currency: z.object({ id: z.string().uuid(), currencyName: z.string() }).optional(),
  entryStatusKey: z.enum(['Draft', 'Submitted', 'Approved', 'Rejected']),
  exchangeRate: z.number().optional(),
  project: z.object({ id: z.string().uuid(), projectName: z.string() }),
  resource: z.object({ id: z.string().uuid(), resourceName: z.string() }),
  reviewComments: z.string().optional(),
  reviewedBy: z.object({ id: z.string().uuid(), resourceName: z.string() }).optional(),
  reviewedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  submittedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  timePeriod: z.object({ id: z.string().uuid(), timePeriodName: z.string() }),
  wBSItem: z.object({ id: z.string().uuid(), wBSItemName: z.string() }),
});

/**
 * Schema for creating a new ResourceHourEntry (omits system-generated ID)
 */
export const CreateResourceHourEntrySchema = ResourceHourEntrySchema.omit({ id: true });

/**
 * Schema for updating an existing ResourceHourEntry
 */
export const UpdateResourceHourEntrySchema = ResourceHourEntrySchema;

export type ResourceHourEntryInput = z.infer<typeof ResourceHourEntrySchema>;
export type CreateResourceHourEntryInput = z.infer<typeof CreateResourceHourEntrySchema>;
export type UpdateResourceHourEntryInput = z.infer<typeof UpdateResourceHourEntrySchema>;