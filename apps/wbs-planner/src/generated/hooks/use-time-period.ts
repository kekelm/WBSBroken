import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TimePeriodService } from "../services/time-period-service";
import type { TimePeriod } from "../models/time-period-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all TimePeriod records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, timePeriodName, endDate, fiscalYear, periodNumber, periodTypeKey, startDate, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useTimePeriodList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["timePeriod-list", options],
    queryFn: () => TimePeriodService.getAll(options),
  });
}

/**
 * Retrieve a single TimePeriod record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useTimePeriod(id: string) {
  return useQuery({
    queryKey: ["timePeriod", id],
    queryFn: () => TimePeriodService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new TimePeriod record.
 * @remarks Form validation: use CreateTimePeriodSchema with zodResolver for type-safe create forms
 */
export function useCreateTimePeriod() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<TimePeriod, "id">) => TimePeriodService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["timePeriod-list"] });
    },
  });
}

/**
 * Update an existing TimePeriod record.
 * @remarks Form validation: use UpdateTimePeriodSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateTimePeriod() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<TimePeriod, "id">>;
    }) => TimePeriodService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["timePeriod-list"] });
      client.invalidateQueries({ queryKey: ["timePeriod", variables.id] });
    },
  });
}

/**
 * Delete a TimePeriod record by its unique identifier.
 */
export function useDeleteTimePeriod() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => TimePeriodService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["timePeriod-list"] });
      client.invalidateQueries({ queryKey: ["timePeriod", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const TimePeriod_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { TimePeriodSchema, CreateTimePeriodSchema, UpdateTimePeriodSchema } from "../validators/time-period-validator";
export type { TimePeriodInput, CreateTimePeriodInput, UpdateTimePeriodInput } from "../validators/time-period-validator";