import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ResourceHourEntryService } from "../services/resource-hour-entry-service";
import type { ResourceHourEntry } from "../models/resource-hour-entry-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ResourceHourEntry records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, entryName, actualCost, actualCostBase, actualHours, entryStatusKey, exchangeRate, reviewComments, reviewedDate, submittedDate
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useResourceHourEntryList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["resourceHourEntry-list", options],
    queryFn: () => ResourceHourEntryService.getAll(options),
  });
}

/**
 * Retrieve a single ResourceHourEntry record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useResourceHourEntry(id: string) {
  return useQuery({
    queryKey: ["resourceHourEntry", id],
    queryFn: () => ResourceHourEntryService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ResourceHourEntry record.
 * @remarks Form validation: use CreateResourceHourEntrySchema with zodResolver for type-safe create forms
 */
export function useCreateResourceHourEntry() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ResourceHourEntry, "id">) => ResourceHourEntryService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["resourceHourEntry-list"] });
    },
  });
}

/**
 * Update an existing ResourceHourEntry record.
 * @remarks Form validation: use UpdateResourceHourEntrySchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateResourceHourEntry() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ResourceHourEntry, "id">>;
    }) => ResourceHourEntryService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["resourceHourEntry-list"] });
      client.invalidateQueries({ queryKey: ["resourceHourEntry", variables.id] });
    },
  });
}

/**
 * Delete a ResourceHourEntry record by its unique identifier.
 */
export function useDeleteResourceHourEntry() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ResourceHourEntryService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["resourceHourEntry-list"] });
      client.invalidateQueries({ queryKey: ["resourceHourEntry", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ResourceHourEntry_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { ResourceHourEntrySchema, CreateResourceHourEntrySchema, UpdateResourceHourEntrySchema } from "../validators/resource-hour-entry-validator";
export type { ResourceHourEntryInput, CreateResourceHourEntryInput, UpdateResourceHourEntryInput } from "../validators/resource-hour-entry-validator";