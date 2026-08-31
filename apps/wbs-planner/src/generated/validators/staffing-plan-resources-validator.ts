import { z } from 'zod';

/**
 * Zod schema for StaffingPlanResources validation
 */
export const StaffingPlanResourcesSchema = z.object({
  id: z.string().uuid(),
  resourceNotes: z.string().min(1, { message: "Resource Notes is required" }),
  laborCategory: z.object({ id: z.string().uuid(), laborCategoryName: z.string() }).optional(),
  opportunity: z.object({ id: z.string().uuid(), opportunityID: z.string() }).optional(),
  resourceLocation: z.string().optional(),
  solutionArea: z.object({ id: z.string().uuid(), solutionArea: z.string() }).optional(),
});

/**
 * Schema for creating a new StaffingPlanResources (omits system-generated ID)
 */
export const CreateStaffingPlanResourcesSchema = StaffingPlanResourcesSchema.omit({ id: true });

/**
 * Schema for updating an existing StaffingPlanResources
 */
export const UpdateStaffingPlanResourcesSchema = StaffingPlanResourcesSchema;

export type StaffingPlanResourcesInput = z.infer<typeof StaffingPlanResourcesSchema>;
export type CreateStaffingPlanResourcesInput = z.infer<typeof CreateStaffingPlanResourcesSchema>;
export type UpdateStaffingPlanResourcesInput = z.infer<typeof UpdateStaffingPlanResourcesSchema>;