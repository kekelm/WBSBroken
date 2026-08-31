import { z } from 'zod';

/**
 * Zod schema for ResourceHours validation
 */
export const ResourceHoursSchema = z.object({
  id: z.string().uuid(),
  hours: z.string().min(1, { message: "Hours is required" }),
  opportunityID: z.object({ id: z.string().uuid(), opportunityID: z.string() }).optional(),
  staffingPlanResources: z.object({ id: z.string().uuid(), resourceNotes: z.string() }).optional(),
  timePeriod: z.object({ id: z.string().uuid(), timePeriodName: z.string() }),
});

/**
 * Schema for creating a new ResourceHours (omits system-generated ID)
 */
export const CreateResourceHoursSchema = ResourceHoursSchema.omit({ id: true });

/**
 * Schema for updating an existing ResourceHours
 */
export const UpdateResourceHoursSchema = ResourceHoursSchema;

export type ResourceHoursInput = z.infer<typeof ResourceHoursSchema>;
export type CreateResourceHoursInput = z.infer<typeof CreateResourceHoursSchema>;
export type UpdateResourceHoursInput = z.infer<typeof UpdateResourceHoursSchema>;