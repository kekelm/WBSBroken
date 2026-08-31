import { z } from 'zod';

/**
 * Zod schema for WBSItem validation
 */
export const WBSItemSchema = z.object({
  id: z.string().uuid(),
  wBSItemName: z.string().min(1, { message: "WBS Item Name is required" }),
  baselineCost: z.number(),
  baselineCostBase: z.number().optional(),
  baselineHours: z.number(),
  currency: z.object({ id: z.string().uuid(), currencyName: z.string() }).optional(),
  description: z.string().optional(),
  exchangeRate: z.number().optional(),
  owner: z.object({ id: z.string().uuid(), resourceName: z.string() }),
  parentWBSItem: z.object({ id: z.string().uuid(), wBSItemName: z.string() }).optional(),
  plannedFinishDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "Planned Finish Date is required" }),
  plannedStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "Planned Start Date is required" }),
  priorityKey: z.enum(['Low', 'Medium', 'High', 'Critical']),
  progressPercent: z.number().int(),
  project: z.object({ id: z.string().uuid(), projectName: z.string() }),
  statusKey: z.enum(['NotStarted', 'InProgress', 'Completed', 'Blocked']),
  wBSCode: z.string().min(1, { message: "WBS Code is required" }),
});

/**
 * Schema for creating a new WBSItem (omits system-generated ID)
 */
export const CreateWBSItemSchema = WBSItemSchema.omit({ id: true });

/**
 * Schema for updating an existing WBSItem
 */
export const UpdateWBSItemSchema = WBSItemSchema;

export type WBSItemInput = z.infer<typeof WBSItemSchema>;
export type CreateWBSItemInput = z.infer<typeof CreateWBSItemSchema>;
export type UpdateWBSItemInput = z.infer<typeof UpdateWBSItemSchema>;