import { z } from 'zod';

/**
 * Zod schema for Risk validation
 */
export const RiskSchema = z.object({
  id: z.string().uuid(),
  riskName: z.string().min(1, { message: "Risk Name is required" }),
  closedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  createdDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created Date is required" }),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "Due Date is required" }),
  impactKey: z.enum(['Low', 'Medium', 'High']),
  mitigationPlan: z.string().optional(),
  owner: z.object({ id: z.string().uuid(), resourceName: z.string() }),
  probabilityKey: z.enum(['Low', 'Medium', 'High']),
  project: z.object({ id: z.string().uuid(), projectName: z.string() }),
  riskScore: z.number().int(),
  statusKey: z.enum(['Open', 'Mitigating', 'Closed', 'Accepted', 'Escalated']),
  wBSItem: z.object({ id: z.string().uuid(), wBSItemName: z.string() }).optional(),
});

/**
 * Schema for creating a new Risk (omits system-generated ID)
 */
export const CreateRiskSchema = RiskSchema.omit({ id: true });

/**
 * Schema for updating an existing Risk
 */
export const UpdateRiskSchema = RiskSchema;

export type RiskInput = z.infer<typeof RiskSchema>;
export type CreateRiskInput = z.infer<typeof CreateRiskSchema>;
export type UpdateRiskInput = z.infer<typeof UpdateRiskSchema>;