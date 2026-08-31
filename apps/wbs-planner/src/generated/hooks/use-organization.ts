import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OrganizationService } from "../services/organization-service";
import type { Organization } from "../models/organization-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Organization records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, organizationName
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useOrganizationList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["organization-list", options],
    queryFn: () => OrganizationService.getAll(options),
  });
}

/**
 * Retrieve a single Organization record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useOrganization(id: string) {
  return useQuery({
    queryKey: ["organization", id],
    queryFn: () => OrganizationService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Organization record.
 * @remarks Form validation: use CreateOrganizationSchema with zodResolver for type-safe create forms
 */
export function useCreateOrganization() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Organization, "id">) => OrganizationService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["organization-list"] });
    },
  });
}

/**
 * Update an existing Organization record.
 * @remarks Form validation: use UpdateOrganizationSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateOrganization() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Organization, "id">>;
    }) => OrganizationService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["organization-list"] });
      client.invalidateQueries({ queryKey: ["organization", variables.id] });
    },
  });
}

/**
 * Delete a Organization record by its unique identifier.
 */
export function useDeleteOrganization() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => OrganizationService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["organization-list"] });
      client.invalidateQueries({ queryKey: ["organization", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const Organization_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { OrganizationSchema, CreateOrganizationSchema, UpdateOrganizationSchema } from "../validators/organization-validator";
export type { OrganizationInput, CreateOrganizationInput, UpdateOrganizationInput } from "../validators/organization-validator";