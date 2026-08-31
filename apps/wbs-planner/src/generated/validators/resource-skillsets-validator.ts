import { z } from 'zod';

/**
 * Zod schema for ResourceSkillsets validation
 */
export const ResourceSkillsetsSchema = z.object({
  id: z.string().uuid(),
  skillsetIdentifier: z.string().min(1, { message: "Skillset Identifier is required" }),
  level1SkillsetName: z.object({ id: z.string().uuid(), level1SkillsetSolutionAreaSkillsetsKey: z.string() }).optional(),
  level2SkillsetName: z.object({ id: z.string().uuid(), level2SkillsetName: z.string() }).optional(),
  skillsetType: z.string().optional(),
  solutionArea: z.object({ id: z.string().uuid(), solutionArea: z.string() }).optional(),
  solutionAreaSkillset: z.object({ id: z.string().uuid(), skillsetAreaSolutionAreaKey: z.string() }).optional(),
  staffingPlanResource: z.object({ id: z.string().uuid(), resourceNotes: z.string() }).optional(),
  staffingPlanResources: z.object({ id: z.string().uuid(), resourceNotes: z.string() }).optional(),
});

/**
 * Schema for creating a new ResourceSkillsets (omits system-generated ID)
 */
export const CreateResourceSkillsetsSchema = ResourceSkillsetsSchema.omit({ id: true });

/**
 * Schema for updating an existing ResourceSkillsets
 */
export const UpdateResourceSkillsetsSchema = ResourceSkillsetsSchema;

export type ResourceSkillsetsInput = z.infer<typeof ResourceSkillsetsSchema>;
export type CreateResourceSkillsetsInput = z.infer<typeof CreateResourceSkillsetsSchema>;
export type UpdateResourceSkillsetsInput = z.infer<typeof UpdateResourceSkillsetsSchema>;