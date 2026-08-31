import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SolutionAreaService } from "../services/solution-area-service";
import type { SolutionArea } from "../models/solution-area-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all SolutionArea records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, solutionArea
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useSolutionAreaList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["solutionArea-list", options],
    queryFn: () => SolutionAreaService.getAll(options),
  });
}

/**
 * Retrieve a single SolutionArea record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useSolutionArea(id: string) {
  return useQuery({
    queryKey: ["solutionArea", id],
    queryFn: () => SolutionAreaService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new SolutionArea record.
 * @remarks Form validation: use CreateSolutionAreaSchema with zodResolver for type-safe create forms
 */
export function useCreateSolutionArea() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<SolutionArea, "id">) => SolutionAreaService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["solutionArea-list"] });
    },
  });
}

/**
 * Update an existing SolutionArea record.
 * @remarks Form validation: use UpdateSolutionAreaSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateSolutionArea() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<SolutionArea, "id">>;
    }) => SolutionAreaService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["solutionArea-list"] });
      client.invalidateQueries({ queryKey: ["solutionArea", variables.id] });
    },
  });
}

/**
 * Delete a SolutionArea record by its unique identifier.
 */
export function useDeleteSolutionArea() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => SolutionAreaService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["solutionArea-list"] });
      client.invalidateQueries({ queryKey: ["solutionArea", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const SolutionArea_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { SolutionAreaSchema, CreateSolutionAreaSchema, UpdateSolutionAreaSchema } from "../validators/solution-area-validator";
export type { SolutionAreaInput, CreateSolutionAreaInput, UpdateSolutionAreaInput } from "../validators/solution-area-validator";