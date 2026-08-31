import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LaborCategoryService } from "../services/labor-category-service";
import type { LaborCategory } from "../models/labor-category-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all LaborCategory records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, laborCategoryName, exchangeRate, laborBillRate, laborBillRateBase, laborCostRate, laborCostRateBase
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useLaborCategoryList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["laborCategory-list", options],
    queryFn: () => LaborCategoryService.getAll(options),
  });
}

/**
 * Retrieve a single LaborCategory record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useLaborCategory(id: string) {
  return useQuery({
    queryKey: ["laborCategory", id],
    queryFn: () => LaborCategoryService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new LaborCategory record.
 * @remarks Form validation: use CreateLaborCategorySchema with zodResolver for type-safe create forms
 */
export function useCreateLaborCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<LaborCategory, "id">) => LaborCategoryService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["laborCategory-list"] });
    },
  });
}

/**
 * Update an existing LaborCategory record.
 * @remarks Form validation: use UpdateLaborCategorySchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateLaborCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<LaborCategory, "id">>;
    }) => LaborCategoryService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["laborCategory-list"] });
      client.invalidateQueries({ queryKey: ["laborCategory", variables.id] });
    },
  });
}

/**
 * Delete a LaborCategory record by its unique identifier.
 */
export function useDeleteLaborCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => LaborCategoryService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["laborCategory-list"] });
      client.invalidateQueries({ queryKey: ["laborCategory", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const LaborCategory_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { LaborCategorySchema, CreateLaborCategorySchema, UpdateLaborCategorySchema } from "../validators/labor-category-validator";
export type { LaborCategoryInput, CreateLaborCategoryInput, UpdateLaborCategoryInput } from "../validators/labor-category-validator";