import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Level2SkillsetNamesService } from "../services/level2skillset-names-service";
import type { Level2SkillsetNames } from "../models/level2skillset-names-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Level2SkillsetNames records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, level2SkillsetName
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useLevel2SkillsetNamesList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["level2SkillsetNames-list", options],
    queryFn: () => Level2SkillsetNamesService.getAll(options),
  });
}

/**
 * Retrieve a single Level2SkillsetNames record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useLevel2SkillsetNames(id: string) {
  return useQuery({
    queryKey: ["level2SkillsetNames", id],
    queryFn: () => Level2SkillsetNamesService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Level2SkillsetNames record.
 * @remarks Form validation: use CreateLevel2SkillsetNamesSchema with zodResolver for type-safe create forms
 */
export function useCreateLevel2SkillsetNames() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Level2SkillsetNames, "id">) => Level2SkillsetNamesService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["level2SkillsetNames-list"] });
    },
  });
}

/**
 * Update an existing Level2SkillsetNames record.
 * @remarks Form validation: use UpdateLevel2SkillsetNamesSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateLevel2SkillsetNames() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Level2SkillsetNames, "id">>;
    }) => Level2SkillsetNamesService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["level2SkillsetNames-list"] });
      client.invalidateQueries({ queryKey: ["level2SkillsetNames", variables.id] });
    },
  });
}

/**
 * Delete a Level2SkillsetNames record by its unique identifier.
 */
export function useDeleteLevel2SkillsetNames() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => Level2SkillsetNamesService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["level2SkillsetNames-list"] });
      client.invalidateQueries({ queryKey: ["level2SkillsetNames", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const Level2SkillsetNames_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { Level2SkillsetNamesSchema, CreateLevel2SkillsetNamesSchema, UpdateLevel2SkillsetNamesSchema } from "../validators/level2skillset-names-validator";
export type { Level2SkillsetNamesInput, CreateLevel2SkillsetNamesInput, UpdateLevel2SkillsetNamesInput } from "../validators/level2skillset-names-validator";