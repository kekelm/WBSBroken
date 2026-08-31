import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WBSEstimateService } from "../services/wbs-estimate-service";
import type { WBSEstimate } from "../models/wbs-estimate-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all WBSEstimate records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, estimateName, approvalComments, approvedDate, costRate, costRateBase, createdDate, estimateStatusKey, exchangeRate, plannedCost, plannedCostBase, plannedHours
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useWBSEstimateList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["wBSEstimate-list", options],
    queryFn: () => WBSEstimateService.getAll(options),
  });
}

/**
 * Retrieve a single WBSEstimate record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useWBSEstimate(id: string) {
  return useQuery({
    queryKey: ["wBSEstimate", id],
    queryFn: () => WBSEstimateService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new WBSEstimate record.
 * @remarks Form validation: use CreateWBSEstimateSchema with zodResolver for type-safe create forms
 */
export function useCreateWBSEstimate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<WBSEstimate, "id">) => WBSEstimateService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["wBSEstimate-list"] });
    },
  });
}

/**
 * Update an existing WBSEstimate record.
 * @remarks Form validation: use UpdateWBSEstimateSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateWBSEstimate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<WBSEstimate, "id">>;
    }) => WBSEstimateService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["wBSEstimate-list"] });
      client.invalidateQueries({ queryKey: ["wBSEstimate", variables.id] });
    },
  });
}

/**
 * Delete a WBSEstimate record by its unique identifier.
 */
export function useDeleteWBSEstimate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => WBSEstimateService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["wBSEstimate-list"] });
      client.invalidateQueries({ queryKey: ["wBSEstimate", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const WBSEstimate_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { WBSEstimateSchema, CreateWBSEstimateSchema, UpdateWBSEstimateSchema } from "../validators/wbsestimate-validator";
export type { WBSEstimateInput, CreateWBSEstimateInput, UpdateWBSEstimateInput } from "../validators/wbsestimate-validator";