import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ResourceSkillsetsService } from "../services/resource-skillsets-service";
import type { ResourceSkillsets } from "../models/resource-skillsets-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ResourceSkillsets records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, skillsetIdentifier, skillsetType
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useResourceSkillsetsList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["resourceSkillsets-list", options],
    queryFn: () => ResourceSkillsetsService.getAll(options),
  });
}

/**
 * Retrieve a single ResourceSkillsets record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useResourceSkillsets(id: string) {
  return useQuery({
    queryKey: ["resourceSkillsets", id],
    queryFn: () => ResourceSkillsetsService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ResourceSkillsets record.
 * @remarks Form validation: use CreateResourceSkillsetsSchema with zodResolver for type-safe create forms
 */
export function useCreateResourceSkillsets() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ResourceSkillsets, "id">) => ResourceSkillsetsService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["resourceSkillsets-list"] });
    },
  });
}

/**
 * Update an existing ResourceSkillsets record.
 * @remarks Form validation: use UpdateResourceSkillsetsSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateResourceSkillsets() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ResourceSkillsets, "id">>;
    }) => ResourceSkillsetsService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["resourceSkillsets-list"] });
      client.invalidateQueries({ queryKey: ["resourceSkillsets", variables.id] });
    },
  });
}

/**
 * Delete a ResourceSkillsets record by its unique identifier.
 */
export function useDeleteResourceSkillsets() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ResourceSkillsetsService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["resourceSkillsets-list"] });
      client.invalidateQueries({ queryKey: ["resourceSkillsets", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ResourceSkillsets_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { ResourceSkillsetsSchema, CreateResourceSkillsetsSchema, UpdateResourceSkillsetsSchema } from "../validators/resource-skillsets-validator";
export type { ResourceSkillsetsInput, CreateResourceSkillsetsInput, UpdateResourceSkillsetsInput } from "../validators/resource-skillsets-validator";