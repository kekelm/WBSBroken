import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WBSItemService } from "../services/wbs-item-service";
import type { WBSItem } from "../models/wbs-item-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all WBSItem records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, wBSItemName, baselineCost, baselineCostBase, baselineHours, description, exchangeRate, plannedFinishDate, plannedStartDate, priorityKey, progressPercent, statusKey, wBSCode
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useWBSItemList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["wBSItem-list", options],
    queryFn: () => WBSItemService.getAll(options),
  });
}

/**
 * Retrieve a single WBSItem record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useWBSItem(id: string) {
  return useQuery({
    queryKey: ["wBSItem", id],
    queryFn: () => WBSItemService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new WBSItem record.
 * @remarks Form validation: use CreateWBSItemSchema with zodResolver for type-safe create forms
 */
export function useCreateWBSItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<WBSItem, "id">) => WBSItemService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["wBSItem-list"] });
    },
  });
}

/**
 * Update an existing WBSItem record.
 * @remarks Form validation: use UpdateWBSItemSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateWBSItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<WBSItem, "id">>;
    }) => WBSItemService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["wBSItem-list"] });
      client.invalidateQueries({ queryKey: ["wBSItem", variables.id] });
    },
  });
}

/**
 * Delete a WBSItem record by its unique identifier.
 */
export function useDeleteWBSItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => WBSItemService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["wBSItem-list"] });
      client.invalidateQueries({ queryKey: ["wBSItem", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const WBSItem_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { WBSItemSchema, CreateWBSItemSchema, UpdateWBSItemSchema } from "../validators/wbsitem-validator";
export type { WBSItemInput, CreateWBSItemInput, UpdateWBSItemInput } from "../validators/wbsitem-validator";