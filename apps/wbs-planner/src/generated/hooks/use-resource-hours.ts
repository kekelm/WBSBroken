import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ResourceHoursService } from "../services/resource-hours-service";
import type { ResourceHours } from "../models/resource-hours-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ResourceHours records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, hours
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useResourceHoursList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["resourceHours-list", options],
    queryFn: () => ResourceHoursService.getAll(options),
  });
}

/**
 * Retrieve a single ResourceHours record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useResourceHours(id: string) {
  return useQuery({
    queryKey: ["resourceHours", id],
    queryFn: () => ResourceHoursService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ResourceHours record.
 * @remarks Form validation: use CreateResourceHoursSchema with zodResolver for type-safe create forms
 */
export function useCreateResourceHours() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ResourceHours, "id">) => ResourceHoursService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["resourceHours-list"] });
    },
  });
}

/**
 * Update an existing ResourceHours record.
 * @remarks Form validation: use UpdateResourceHoursSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateResourceHours() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ResourceHours, "id">>;
    }) => ResourceHoursService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["resourceHours-list"] });
      client.invalidateQueries({ queryKey: ["resourceHours", variables.id] });
    },
  });
}

/**
 * Delete a ResourceHours record by its unique identifier.
 */
export function useDeleteResourceHours() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ResourceHoursService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["resourceHours-list"] });
      client.invalidateQueries({ queryKey: ["resourceHours", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ResourceHours_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { ResourceHoursSchema, CreateResourceHoursSchema, UpdateResourceHoursSchema } from "../validators/resource-hours-validator";
export type { ResourceHoursInput, CreateResourceHoursInput, UpdateResourceHoursInput } from "../validators/resource-hours-validator";