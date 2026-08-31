import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WBSDependencyService } from "../services/wbs-dependency-service";
import type { WBSDependency } from "../models/wbs-dependency-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all WBSDependency records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, dependencyName, dependencyTypeKey, lagDays, notes, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useWBSDependencyList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["wBSDependency-list", options],
    queryFn: () => WBSDependencyService.getAll(options),
  });
}

/**
 * Retrieve a single WBSDependency record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useWBSDependency(id: string) {
  return useQuery({
    queryKey: ["wBSDependency", id],
    queryFn: () => WBSDependencyService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new WBSDependency record.
 * @remarks Form validation: use CreateWBSDependencySchema with zodResolver for type-safe create forms
 */
export function useCreateWBSDependency() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<WBSDependency, "id">) => WBSDependencyService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["wBSDependency-list"] });
    },
  });
}

/**
 * Update an existing WBSDependency record.
 * @remarks Form validation: use UpdateWBSDependencySchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateWBSDependency() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<WBSDependency, "id">>;
    }) => WBSDependencyService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["wBSDependency-list"] });
      client.invalidateQueries({ queryKey: ["wBSDependency", variables.id] });
    },
  });
}

/**
 * Delete a WBSDependency record by its unique identifier.
 */
export function useDeleteWBSDependency() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => WBSDependencyService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["wBSDependency-list"] });
      client.invalidateQueries({ queryKey: ["wBSDependency", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const WBSDependency_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { WBSDependencySchema, CreateWBSDependencySchema, UpdateWBSDependencySchema } from "../validators/wbsdependency-validator";
export type { WBSDependencyInput, CreateWBSDependencyInput, UpdateWBSDependencyInput } from "../validators/wbsdependency-validator";