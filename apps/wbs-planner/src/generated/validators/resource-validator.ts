import { z } from 'zod';

/**
 * Zod schema for Resource validation
 */
export const ResourceSchema = z.object({
  id: z.string().uuid(),
  resourceName: z.string().min(1, { message: "Resource Name is required" }),
  costRate: z.number(),
  costRateBase: z.number().optional(),
  currency: z.object({ id: z.string().uuid(), currencyName: z.string() }).optional(),
  email: z.string().email().min(1, { message: "Email is required" }),
  exchangeRate: z.number().optional(),
  manager: z.object({ id: z.string().uuid(), resourceName: z.string() }).optional(),
  phone: z.string().optional(),
  resourceRoleKey: z.enum(['ProjectManager', 'DeliveryLead', 'BusinessAnalyst', 'Developer', 'Tester']),
  statusKey: z.enum(['Active', 'Inactive', 'OnLeave']),
  weeklyCapacityHours: z.number().int(),
});

/**
 * Schema for creating a new Resource (omits system-generated ID)
 */
export const CreateResourceSchema = ResourceSchema.omit({ id: true });

/**
 * Schema for updating an existing Resource
 */
export const UpdateResourceSchema = ResourceSchema;

export type ResourceInput = z.infer<typeof ResourceSchema>;
export type CreateResourceInput = z.infer<typeof CreateResourceSchema>;
export type UpdateResourceInput = z.infer<typeof UpdateResourceSchema>;