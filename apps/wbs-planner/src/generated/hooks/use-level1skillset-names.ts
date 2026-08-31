import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Level1SkillsetNamesService } from "../services/level1skillset-names-service";
import type { Level1SkillsetNames } from "../models/level1skillset-names-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Level1SkillsetNames records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, level1SkillsetSolutionAreaSkillsetsKey, level1SkillsetName
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useLevel1SkillsetNamesList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["level1SkillsetNames-list", options],
    queryFn: () => Level1SkillsetNamesService.getAll(options),
  });
}

/**
 * Retrieve a single Level1SkillsetNames record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useLevel1SkillsetNames(id: string) {
  return useQuery({
    queryKey: ["level1SkillsetNames", id],
    queryFn: () => Level1SkillsetNamesService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Level1SkillsetNames record.
 * @remarks Form validation: use CreateLevel1SkillsetNamesSchema with zodResolver for type-safe create forms
 */
export function useCreateLevel1SkillsetNames() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Level1SkillsetNames, "id">) => Level1SkillsetNamesService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["level1SkillsetNames-list"] });
    },
  });
}

/**
 * Update an existing Level1SkillsetNames record.
 * @remarks Form validation: use UpdateLevel1SkillsetNamesSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateLevel1SkillsetNames() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Level1SkillsetNames, "id">>;
    }) => Level1SkillsetNamesService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["level1SkillsetNames-list"] });
      client.invalidateQueries({ queryKey: ["level1SkillsetNames", variables.id] });
    },
  });
}

/**
 * Delete a Level1SkillsetNames record by its unique identifier.
 */
export function useDeleteLevel1SkillsetNames() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => Level1SkillsetNamesService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["level1SkillsetNames-list"] });
      client.invalidateQueries({ queryKey: ["level1SkillsetNames", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const Level1SkillsetNames_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { Level1SkillsetNamesSchema, CreateLevel1SkillsetNamesSchema, UpdateLevel1SkillsetNamesSchema } from "../validators/level1skillset-names-validator";
export type { Level1SkillsetNamesInput, CreateLevel1SkillsetNamesInput, UpdateLevel1SkillsetNamesInput } from "../validators/level1skillset-names-validator";