import type { Project } from '@/generated/models/project-model';
import type { Resource } from '@/generated/models/resource-model';
import type { ResourceHourEntry } from '@/generated/models/resource-hour-entry-model';
import type { TimePeriod } from '@/generated/models/time-period-model';
import type { WBSItem } from '@/generated/models/wbs-item-model';

export const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

export function sumBy<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((total: number, item: T) => total + selector(item), 0);
}

export function findProject(projects: Project[] | undefined): Project | undefined {
  return projects?.[0];
}

export function projectItems(items: WBSItem[] | undefined, project?: Project): WBSItem[] {
  return (items ?? []).filter((item: WBSItem) => !project || item.project?.id === project.id);
}

export function projectHours(entries: ResourceHourEntry[] | undefined, project?: Project): ResourceHourEntry[] {
  return (entries ?? []).filter((entry: ResourceHourEntry) => !project || entry.project?.id === project.id);
}

export function periodHours(entries: ResourceHourEntry[], wbsItem: WBSItem, resource: Resource, period: TimePeriod): number {
  return sumBy(
    entries.filter((entry: ResourceHourEntry) => entry.wBSItem?.id === wbsItem.id && entry.resource?.id === resource.id && entry.timePeriod?.id === period.id),
    (entry: ResourceHourEntry) => entry.actualHours,
  );
}

export function periodHoursById(entries: ResourceHourEntry[], wbsItem: WBSItem, resource: Resource, periodId: string): number {
  return sumBy(
    entries.filter((entry: ResourceHourEntry) => entry.wBSItem?.id === wbsItem.id && entry.resource?.id === resource.id && entry.timePeriod?.id === periodId),
    (entry: ResourceHourEntry) => entry.actualHours,
  );
}

export function completion(items: WBSItem[]): number {
  if (items.length === 0) {
    return 0;
  }
  return Math.round(sumBy(items, (item: WBSItem) => item.progressPercent) / items.length);
}

export function itemActualHours(entries: ResourceHourEntry[], item: WBSItem): number {
  return sumBy(entries.filter((entry: ResourceHourEntry) => entry.wBSItem?.id === item.id), (entry: ResourceHourEntry) => entry.actualHours);
}

export function resourceActualHours(entries: ResourceHourEntry[], resource: Resource): number {
  return sumBy(entries.filter((entry: ResourceHourEntry) => entry.resource?.id === resource.id), (entry: ResourceHourEntry) => entry.actualHours);
}
