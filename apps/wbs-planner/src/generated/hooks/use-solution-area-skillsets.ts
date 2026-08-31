import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SolutionAreaSkillsetsService } from "../services/solution-area-skillsets-service";
import type { SolutionAreaSkillsets } from "../models/solution-area-skillsets-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all SolutionAreaSkillsets records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, skillsetAreaSolutionAreaKey, skillsetArea
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useSolutionAreaSkillsetsList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["solutionAreaSkillsets-list", options],
    queryFn: () => SolutionAreaSkillsetsService.getAll(options),
  });
}

/**
 * Retrieve a single SolutionAreaSkillsets record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useSolutionAreaSkillsets(id: string) {
  return useQuery({
    queryKey: ["solutionAreaSkillsets", id],
    queryFn: () => SolutionAreaSkillsetsService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new SolutionAreaSkillsets record.
 * @remarks Form validation: use CreateSolutionAreaSkillsetsSchema with zodResolver for type-safe create forms
 */
export function useCreateSolutionAreaSkillsets() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<SolutionAreaSkillsets, "id">) => SolutionAreaSkillsetsService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["solutionAreaSkillsets-list"] });
    },
  });
}

/**
 * Update an existing SolutionAreaSkillsets record.
 * @remarks Form validation: use UpdateSolutionAreaSkillsetsSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateSolutionAreaSkillsets() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<SolutionAreaSkillsets, "id">>;
    }) => SolutionAreaSkillsetsService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["solutionAreaSkillsets-list"] });
      client.invalidateQueries({ queryKey: ["solutionAreaSkillsets", variables.id] });
    },
  });
}

/**
 * Delete a SolutionAreaSkillsets record by its unique identifier.
 */
export function useDeleteSolutionAreaSkillsets() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => SolutionAreaSkillsetsService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["solutionAreaSkillsets-list"] });
      client.invalidateQueries({ queryKey: ["solutionAreaSkillsets", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const SolutionAreaSkillsets_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { SolutionAreaSkillsetsSchema, CreateSolutionAreaSkillsetsSchema, UpdateSolutionAreaSkillsetsSchema } from "../validators/solution-area-skillsets-validator";
export type { SolutionAreaSkillsetsInput, CreateSolutionAreaSkillsetsInput, UpdateSolutionAreaSkillsetsInput } from "../validators/solution-area-skillsets-validator";