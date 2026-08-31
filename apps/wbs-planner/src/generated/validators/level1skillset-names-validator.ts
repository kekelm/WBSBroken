import { z } from 'zod';

/**
 * Zod schema for Level1SkillsetNames validation
 */
export const Level1SkillsetNamesSchema = z.object({
  id: z.string().uuid(),
  level1SkillsetSolutionAreaSkillsetsKey: z.string().min(1, { message: "Level1 Skillset + Solution Area Skillsets Key is required" }),
  level1SkillsetName: z.string().min(1, { message: "Level1 Skillset Name is required" }),
  solutionAreaSkillsets: z.object({ id: z.string().uuid(), skillsetAreaSolutionAreaKey: z.string() }),
});

/**
 * Schema for creating a new Level1SkillsetNames (omits system-generated ID)
 */
export const CreateLevel1SkillsetNamesSchema = Level1SkillsetNamesSchema.omit({ id: true });

/**
 * Schema for updating an existing Level1SkillsetNames
 */
export const UpdateLevel1SkillsetNamesSchema = Level1SkillsetNamesSchema;

export type Level1SkillsetNamesInput = z.infer<typeof Level1SkillsetNamesSchema>;
export type CreateLevel1SkillsetNamesInput = z.infer<typeof CreateLevel1SkillsetNamesSchema>;
export type UpdateLevel1SkillsetNamesInput = z.infer<typeof UpdateLevel1SkillsetNamesSchema>;