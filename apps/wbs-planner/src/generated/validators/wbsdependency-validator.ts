import { z } from 'zod';

/**
 * Zod schema for WBSDependency validation
 */
export const WBSDependencySchema = z.object({
  id: z.string().uuid(),
  dependencyName: z.string().min(1, { message: "Dependency Name is required" }),
  dependencyTypeKey: z.enum(['FinishToStart', 'StartToStart', 'FinishToFinish', 'StartToFinish']),
  lagDays: z.number().int(),
  notes: z.string().optional(),
  predecessorWBSItem: z.object({ id: z.string().uuid(), wBSItemName: z.string() }),
  project: z.object({ id: z.string().uuid(), projectName: z.string() }),
  statusKey: z.enum(['Proposed', 'Active', 'Resolved', 'Cancelled']),
  successorWBSItem: z.object({ id: z.string().uuid(), wBSItemName: z.string() }),
});

/**
 * Schema for creating a new WBSDependency (omits system-generated ID)
 */
export const CreateWBSDependencySchema = WBSDependencySchema.omit({ id: true });

/**
 * Schema for updating an existing WBSDependency
 */
export const UpdateWBSDependencySchema = WBSDependencySchema;

export type WBSDependencyInput = z.infer<typeof WBSDependencySchema>;
export type CreateWBSDependencyInput = z.infer<typeof CreateWBSDependencySchema>;
export type UpdateWBSDependencyInput = z.infer<typeof UpdateWBSDependencySchema>;