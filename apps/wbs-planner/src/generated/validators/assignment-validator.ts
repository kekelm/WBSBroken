import { z } from 'zod';

/**
 * Zod schema for Assignment validation
 */
export const AssignmentSchema = z.object({
  id: z.string().uuid(),
  assignmentName: z.string().min(1, { message: "Assignment Name is required" }),
  allocationPercent: z.number().int(),
  assignedBy: z.object({ id: z.string().uuid(), resourceName: z.string() }),
  assignedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Assigned Date is required" }),
  plannedFinishDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "Planned Finish Date is required" }),
  plannedStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "Planned Start Date is required" }),
  resource: z.object({ id: z.string().uuid(), resourceName: z.string() }),
  roleOnTaskKey: z.enum(['Lead', 'Contributor', 'Reviewer', 'Approver']),
  statusKey: z.enum(['NotStarted', 'InProgress', 'Completed', 'Blocked']),
  wBSItem: z.object({ id: z.string().uuid(), wBSItemName: z.string() }),
});

/**
 * Schema for creating a new Assignment (omits system-generated ID)
 */
export const CreateAssignmentSchema = AssignmentSchema.omit({ id: true });

/**
 * Schema for updating an existing Assignment
 */
export const UpdateAssignmentSchema = AssignmentSchema;

export type AssignmentInput = z.infer<typeof AssignmentSchema>;
export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof UpdateAssignmentSchema>;