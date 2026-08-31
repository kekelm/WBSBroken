import { z } from 'zod';

/**
 * Zod schema for Project validation
 */
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  projectName: z.string().min(1, { message: "Project Name is required" }),
  budget: z.number(),
  budgetBase: z.number().optional(),
  createdBy: z.object({ id: z.string().uuid(), resourceName: z.string() }),
  createdDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created Date is required" }),
  currency: z.object({ id: z.string().uuid(), currencyName: z.string() }).optional(),
  deliveryLead: z.object({ id: z.string().uuid(), resourceName: z.string() }),
  description: z.string().optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "End Date is required" }),
  exchangeRate: z.number().optional(),
  projectManager: z.object({ id: z.string().uuid(), resourceName: z.string() }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "Start Date is required" }),
  statusKey: z.enum(['Draft', 'Planning', 'InProgress', 'OnHold', 'Completed', 'Cancelled']),
});

/**
 * Schema for creating a new Project (omits system-generated ID)
 */
export const CreateProjectSchema = ProjectSchema.omit({ id: true });

/**
 * Schema for updating an existing Project
 */
export const UpdateProjectSchema = ProjectSchema;

export type ProjectInput = z.infer<typeof ProjectSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;