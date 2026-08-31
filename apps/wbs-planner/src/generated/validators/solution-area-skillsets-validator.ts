import { z } from 'zod';

/**
 * Zod schema for SolutionAreaSkillsets validation
 */
export const SolutionAreaSkillsetsSchema = z.object({
  id: z.string().uuid(),
  skillsetAreaSolutionAreaKey: z.string().min(1, { message: "Skillset Area + Solution Area Key is required" }),
  skillsetArea: z.string().min(1, { message: "Skillset_Area is required" }),
  solutionArea: z.object({ id: z.string().uuid(), solutionArea: z.string() }),
});

/**
 * Schema for creating a new SolutionAreaSkillsets (omits system-generated ID)
 */
export const CreateSolutionAreaSkillsetsSchema = SolutionAreaSkillsetsSchema.omit({ id: true });

/**
 * Schema for updating an existing SolutionAreaSkillsets
 */
export const UpdateSolutionAreaSkillsetsSchema = SolutionAreaSkillsetsSchema;

export type SolutionAreaSkillsetsInput = z.infer<typeof SolutionAreaSkillsetsSchema>;
export type CreateSolutionAreaSkillsetsInput = z.infer<typeof CreateSolutionAreaSkillsetsSchema>;
export type UpdateSolutionAreaSkillsetsInput = z.infer<typeof UpdateSolutionAreaSkillsetsSchema>;