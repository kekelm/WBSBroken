import { z } from 'zod';

/**
 * Zod schema for Application validation
 */
export const ApplicationSchema = z.object({
  id: z.string().uuid(),
  name1: z.string().min(1, { message: "Name is required" }),
  accessKey: z.enum(['Allowed', 'Blocked']),
  commonlyUsed: z.boolean().optional(),
  componentStateKey: z.enum(['Published', 'Unpublished', 'Deleted', 'DeletedUnpublished']),
  isManaged: z.boolean(),
  organizationId: z.object({ id: z.string().uuid(), organizationName: z.string() }).optional(),
  recordOverwriteTime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Record Overwrite Time is required" }),
  rowIdUnique: z.string().uuid().min(1, { message: "Row id unique is required" }),
  solution: z.string().uuid().min(1, { message: "Solution is required" }),
});

/**
 * Schema for creating a new Application (omits system-generated ID)
 */
export const CreateApplicationSchema = ApplicationSchema.omit({ id: true });

/**
 * Schema for updating an existing Application
 */
export const UpdateApplicationSchema = ApplicationSchema;

export type ApplicationInput = z.infer<typeof ApplicationSchema>;
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;