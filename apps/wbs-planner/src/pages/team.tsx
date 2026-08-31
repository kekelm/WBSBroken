import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InMemoryDataBanner } from '@/generated/components/in-memory-data-banner';
import { HAS_IN_MEMORY_TABLES, useAssignmentList, useResourceHourEntryList, useResourceList } from '@/generated/hooks';
import type { Assignment } from '@/generated/models/assignment-model';
import type { Resource } from '@/generated/models/resource-model';
import { number, resourceActualHours } from '@/lib/wbs-data';

const bannerMessage = "This app uses draft tables for testing. Data entered won't be saved. Contact the app owner to enable storage.";

export default function TeamPage() {
  const { data: resources } = useResourceList({ orderBy: ['resourceName asc'] });
  const { data: assignments } = useAssignmentList();
  const { data: hours } = useResourceHourEntryList();
  return (
    <div className="space-y-6 p-6">
      <InMemoryDataBanner show={HAS_IN_MEMORY_TABLES} message={bannerMessage} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team workload</h1>
        <p className="text-muted-foreground">Review resource roles, capacity, assignments, and actual entered hours.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {(resources ?? []).map((resource: Resource) => {
          const resourceAssignments = (assignments ?? []).filter((assignment: Assignment) => assignment.resource.id === resource.id);
          return (
            <Card key={resource.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>{resource.resourceName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{resource.email}</p>
                </div>
                <Badge variant="outline">{resource.statusKey}</Badge>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-4">
                <Info label="Role" value={resource.resourceRoleKey} />
                <Info label="Capacity" value={`${resource.weeklyCapacityHours}h/wk`} />
                <Info label="Assignments" value={`${resourceAssignments.length}`} />
                <Info label="Actual" value={`${number.format(resourceActualHours(hours ?? [], resource))}h`} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary text-secondary-foreground p-3">
      <div className="text-xs font-medium">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
