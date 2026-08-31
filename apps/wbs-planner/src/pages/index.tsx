import { Activity, AlertTriangle, AppWindow, CheckCircle2, Clock, Target } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { InMemoryDataBanner } from '@/generated/components/in-memory-data-banner';
import { HAS_IN_MEMORY_TABLES, useApplicationList, useProjectList, useResourceHourEntryList, useRiskList, useStaffingPlanResourcesList, useWBSItemList } from '@/generated/hooks';
import { completion, findProject, itemActualHours, money, number, projectHours, projectItems, sumBy } from '@/lib/wbs-data';
import { useUser } from '@/hooks/use-user';
import type { WBSItem } from '@/generated/models/wbs-item-model';

const bannerMessage = "This app uses draft tables for testing. Data entered won't be saved. Contact the app owner to enable storage.";

export default function HomePage() {
  const { data: user } = useUser();
  const { data: projects } = useProjectList();
  const { data: applications } = useApplicationList();
  const { data: wbsItems } = useWBSItemList();
  const { data: hours } = useResourceHourEntryList();
  const { data: risks } = useRiskList();
  const { data: staffingPlanResources } = useStaffingPlanResourcesList();
  const activeProject = findProject(projects);
  const items = projectItems(wbsItems, activeProject);
  const entries = projectHours(hours, activeProject);
  const baselineHours = sumBy(items, (item: WBSItem) => item.baselineHours);
  const actualHours = sumBy(entries, (entry) => entry.actualHours);
  const variance = actualHours - baselineHours;
  const blocked = items.filter((item: WBSItem) => item.statusKey === 'Blocked').length;
  const allowedApplicationCount = applications?.filter((application) => application.accessKey === 'Allowed').length ?? 0;
  const plannedResourceCount = staffingPlanResources?.length ?? 0;
  const complete = completion(items);

  return (
    <div className="space-y-6 p-6">
      <InMemoryDataBanner show={HAS_IN_MEMORY_TABLES} message={bannerMessage} />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Project control dashboard</h1>
        <p className="text-muted-foreground">{user?.fullName ? `Welcome, ${user.fullName}. ` : ''}Track WBS scope, effort, risks, and resource-hour variance.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Completion" value={`${complete}%`} icon={CheckCircle2} detail="Average WBS progress" />
        <MetricCard title="Allowed applications" value={`${allowedApplicationCount}`} icon={AppWindow} detail={`${applications?.length ?? 0} catalog records`} />
        <MetricCard title="Actual hours" value={number.format(actualHours)} icon={Clock} detail={`${number.format(baselineHours)} planned`} />
        <MetricCard title="Open risks" value={`${risks?.filter((risk) => risk.statusKey !== 'Closed').length ?? 0}`} icon={AlertTriangle} detail={`${blocked} blocked WBS items`} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{activeProject?.projectName ?? 'Project'} WBS health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item: WBSItem) => {
              const actual = itemActualHours(entries, item);
              return (
                <div key={item.id} className="rounded-md border border-border bg-card text-card-foreground p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{item.wBSCode} {item.wBSItemName}</div>
                      <div className="text-sm text-muted-foreground">Owner: {item.owner?.resourceName ?? 'Unassigned'}</div>
                    </div>
                    <Badge variant={item.statusKey === 'Blocked' ? 'destructive' : 'secondary'}>{item.statusKey}</Badge>
                  </div>
                  <Progress value={item.progressPercent} className="mt-3" />
                  <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                    <span>Baseline {number.format(item.baselineHours)}h</span>
                    <span>Actual {number.format(actual)}h</span>
                    <span>Cost {money.format(item.baselineCost)}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Controls focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FocusRow icon={AppWindow} label="Application access" value={`${allowedApplicationCount} allowed applications`} />
            <FocusRow icon={Target} label="Baseline scope" value={`${items.length} WBS items`} />
            <FocusRow icon={Clock} label="Time entered" value={`${entries.length} hour entries`} />
            <FocusRow icon={AlertTriangle} label="Risk pressure" value={`${risks?.filter((risk) => risk.statusKey === 'Escalated').length ?? 0} escalated`} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, detail, icon: Icon }: { title: string; value: string; detail: string; icon: typeof Activity }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className="rounded-md bg-primary text-primary-foreground p-3"><Icon className="h-5 w-5" /></div>
      </CardContent>
    </Card>
  );
}

function FocusRow({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Target }) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-secondary text-secondary-foreground p-3">
      <Icon className="h-4 w-4" />
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}
