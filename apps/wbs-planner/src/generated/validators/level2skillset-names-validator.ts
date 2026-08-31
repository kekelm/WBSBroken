import { z } from 'zod';

/**
 * Zod schema for Level2SkillsetNames validation
 */
export const Level2SkillsetNamesSchema = z.object({
  id: z.string().uuid(),
  level2SkillsetName: z.string().min(1, { message: "Level 2 Skillset Name is required" }),
  level1SkillsetNames: z.object({ id: z.string().uuid(), level1SkillsetSolutionAreaSkillsetsKey: z.string() }).optional(),
});

/**
 * Schema for creating a new Level2SkillsetNames (omits system-generated ID)
 */
export const CreateLevel2SkillsetNamesSchema = Level2SkillsetNamesSchema.omit({ id: true });

/**
 * Schema for updating an existing Level2SkillsetNames
 */
export const UpdateLevel2SkillsetNamesSchema = Level2SkillsetNamesSchema;

export type Level2SkillsetNamesInput = z.infer<typeof Level2SkillsetNamesSchema>;
export type CreateLevel2SkillsetNamesInput = z.infer<typeof CreateLevel2SkillsetNamesSchema>;
export type UpdateLevel2SkillsetNamesInput = z.infer<typeof UpdateLevel2SkillsetNamesSchema>;