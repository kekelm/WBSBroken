import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StaffingPlanResourcesService } from "../services/staffing-plan-resources-service";
import type { StaffingPlanResources } from "../models/staffing-plan-resources-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all StaffingPlanResources records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, resourceNotes, resourceLocation
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useStaffingPlanResourcesList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["staffingPlanResources-list", options],
    queryFn: () => StaffingPlanResourcesService.getAll(options),
  });
}

/**
 * Retrieve a single StaffingPlanResources record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useStaffingPlanResources(id: string) {
  return useQuery({
    queryKey: ["staffingPlanResources", id],
    queryFn: () => StaffingPlanResourcesService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new StaffingPlanResources record.
 * @remarks Form validation: use CreateStaffingPlanResourcesSchema with zodResolver for type-safe create forms
 */
export function useCreateStaffingPlanResources() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<StaffingPlanResources, "id">) => StaffingPlanResourcesService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["staffingPlanResources-list"] });
    },
  });
}

/**
 * Update an existing StaffingPlanResources record.
 * @remarks Form validation: use UpdateStaffingPlanResourcesSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateStaffingPlanResources() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<StaffingPlanResources, "id">>;
    }) => StaffingPlanResourcesService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["staffingPlanResources-list"] });
      client.invalidateQueries({ queryKey: ["staffingPlanResources", variables.id] });
    },
  });
}

/**
 * Delete a StaffingPlanResources record by its unique identifier.
 */
export function useDeleteStaffingPlanResources() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => StaffingPlanResourcesService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["staffingPlanResources-list"] });
      client.invalidateQueries({ queryKey: ["staffingPlanResources", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const StaffingPlanResources_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { StaffingPlanResourcesSchema, CreateStaffingPlanResourcesSchema, UpdateStaffingPlanResourcesSchema } from "../validators/staffing-plan-resources-validator";
export type { StaffingPlanResourcesInput, CreateStaffingPlanResourcesInput, UpdateStaffingPlanResourcesInput } from "../validators/staffing-plan-resources-validator";