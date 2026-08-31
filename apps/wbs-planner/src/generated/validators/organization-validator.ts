import { z } from 'zod';

/**
 * Zod schema for Organization validation
 */
export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  organizationName: z.string().min(1, { message: "Organization Name is required" }),
});

/**
 * Schema for creating a new Organization (omits system-generated ID)
 */
export const CreateOrganizationSchema = OrganizationSchema.omit({ id: true });

/**
 * Schema for updating an existing Organization
 */
export const UpdateOrganizationSchema = OrganizationSchema;

export type OrganizationInput = z.infer<typeof OrganizationSchema>;
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;