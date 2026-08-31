import { z } from 'zod';

/**
 * Zod schema for SolutionArea validation
 */
export const SolutionAreaSchema = z.object({
  id: z.string().uuid(),
  solutionArea: z.string().min(1, { message: "Solution Area is required" }),
});

/**
 * Schema for creating a new SolutionArea (omits system-generated ID)
 */
export const CreateSolutionAreaSchema = SolutionAreaSchema.omit({ id: true });

/**
 * Schema for updating an existing SolutionArea
 */
export const UpdateSolutionAreaSchema = SolutionAreaSchema;

export type SolutionAreaInput = z.infer<typeof SolutionAreaSchema>;
export type CreateSolutionAreaInput = z.infer<typeof CreateSolutionAreaSchema>;
export type UpdateSolutionAreaInput = z.infer<typeof UpdateSolutionAreaSchema>;