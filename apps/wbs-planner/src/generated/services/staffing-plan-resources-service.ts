import { getClient } from '../../../app-gen-sdk/data';
import type { StaffingPlanResources } from '../models/staffing-plan-resources-model';
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const DATA_SOURCE_NAME = 'StaffingPlanResources';

export class StaffingPlanResourcesService {
  static async create(record: Omit<StaffingPlanResources, 'id'>): Promise<StaffingPlanResources> {
    const result = await getClient().createRecordAsync(DATA_SOURCE_NAME, record);
    if (!result.success) throw result.error;
    return result.data as StaffingPlanResources;
  }

  static async update(
    id: string,
    changedFields: Partial<Omit<StaffingPlanResources, 'id'>>
  ): Promise<StaffingPlanResources> {
    const result = await getClient().updateRecordAsync(DATA_SOURCE_NAME, id, changedFields);
    if (!result.success) throw result.error;
    return result.data as StaffingPlanResources;
  }

  static async delete(id: string): Promise<void> {
    const result = await getClient().deleteRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
  }

  static async get(id: string): Promise<StaffingPlanResources> {
    const result = await getClient().retrieveRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
    return result.data as StaffingPlanResources;
  }

  static async getAll(options?: IOperationOptions): Promise<StaffingPlanResources[]> {
    const result = await getClient().retrieveMultipleRecordsAsync(DATA_SOURCE_NAME, options);
    if (!result.success) throw result.error;
    return result.data as StaffingPlanResources[];
  }
}