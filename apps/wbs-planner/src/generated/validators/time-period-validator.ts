import { z } from 'zod';

/**
 * Zod schema for TimePeriod validation
 */
export const TimePeriodSchema = z.object({
  id: z.string().uuid(),
  timePeriodName: z.string().min(1, { message: "Time Period Name is required" }),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "End Date is required" }),
  fiscalYear: z.number().int(),
  opportunity: z.object({ id: z.string().uuid(), opportunityID: z.string() }).optional(),
  periodNumber: z.number().int(),
  periodTypeKey: z.enum(['Weekly', 'Monthly']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "Start Date is required" }),
  statusKey: z.enum(['Open', 'Closed', 'Locked']),
});

/**
 * Schema for creating a new TimePeriod (omits system-generated ID)
 */
export const CreateTimePeriodSchema = TimePeriodSchema.omit({ id: true });

/**
 * Schema for updating an existing TimePeriod
 */
export const UpdateTimePeriodSchema = TimePeriodSchema;

export type TimePeriodInput = z.infer<typeof TimePeriodSchema>;
export type CreateTimePeriodInput = z.infer<typeof CreateTimePeriodSchema>;
export type UpdateTimePeriodInput = z.infer<typeof UpdateTimePeriodSchema>;