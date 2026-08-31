import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AssignmentService } from "../services/assignment-service";
import type { Assignment } from "../models/assignment-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Assignment records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, assignmentName, allocationPercent, assignedDate, plannedFinishDate, plannedStartDate, roleOnTaskKey, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useAssignmentList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["assignment-list", options],
    queryFn: () => AssignmentService.getAll(options),
  });
}

/**
 * Retrieve a single Assignment record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useAssignment(id: string) {
  return useQuery({
    queryKey: ["assignment", id],
    queryFn: () => AssignmentService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Assignment record.
 * @remarks Form validation: use CreateAssignmentSchema with zodResolver for type-safe create forms
 */
export function useCreateAssignment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Assignment, "id">) => AssignmentService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["assignment-list"] });
    },
  });
}

/**
 * Update an existing Assignment record.
 * @remarks Form validation: use UpdateAssignmentSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateAssignment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Assignment, "id">>;
    }) => AssignmentService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["assignment-list"] });
      client.invalidateQueries({ queryKey: ["assignment", variables.id] });
    },
  });
}

/**
 * Delete a Assignment record by its unique identifier.
 */
export function useDeleteAssignment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AssignmentService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["assignment-list"] });
      client.invalidateQueries({ queryKey: ["assignment", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const Assignment_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { AssignmentSchema, CreateAssignmentSchema, UpdateAssignmentSchema } from "../validators/assignment-validator";
export type { AssignmentInput, CreateAssignmentInput, UpdateAssignmentInput } from "../validators/assignment-validator";