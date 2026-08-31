import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ResourceService } from "../services/resource-service";
import type { Resource } from "../models/resource-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Resource records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, resourceName, costRate, costRateBase, email, exchangeRate, phone, resourceRoleKey, statusKey, weeklyCapacityHours
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useResourceList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["resource-list", options],
    queryFn: () => ResourceService.getAll(options),
  });
}

/**
 * Retrieve a single Resource record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useResource(id: string) {
  return useQuery({
    queryKey: ["resource", id],
    queryFn: () => ResourceService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Resource record.
 * @remarks Form validation: use CreateResourceSchema with zodResolver for type-safe create forms
 */
export function useCreateResource() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Resource, "id">) => ResourceService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["resource-list"] });
    },
  });
}

/**
 * Update an existing Resource record.
 * @remarks Form validation: use UpdateResourceSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateResource() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Resource, "id">>;
    }) => ResourceService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["resource-list"] });
      client.invalidateQueries({ queryKey: ["resource", variables.id] });
    },
  });
}

/**
 * Delete a Resource record by its unique identifier.
 */
export function useDeleteResource() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ResourceService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["resource-list"] });
      client.invalidateQueries({ queryKey: ["resource", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const Resource_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { ResourceSchema, CreateResourceSchema, UpdateResourceSchema } from "../validators/resource-validator";
export type { ResourceInput, CreateResourceInput, UpdateResourceInput } from "../validators/resource-validator";