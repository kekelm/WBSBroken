import { ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { InMemoryDataBanner } from '@/generated/components/in-memory-data-banner';
import { HAS_IN_MEMORY_TABLES, useProjectList, useWBSItemList } from '@/generated/hooks';
import type { WBSItem } from '@/generated/models/wbs-item-model';
import { findProject, money, projectItems } from '@/lib/wbs-data';

const bannerMessage = "This app uses draft tables for testing. Data entered won't be saved. Contact the app owner to enable storage.";

export default function WbsPage() {
  const { data: projects } = useProjectList();
  const { data: wbsItems } = useWBSItemList({ orderBy: ['wBSCode asc'] });
  const activeProject = findProject(projects);
  const items = projectItems(wbsItems, activeProject);
  return (
    <div className="space-y-6 p-6">
      <InMemoryDataBanner show={HAS_IN_MEMORY_TABLES} message={bannerMessage} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">WBS Builder</h1>
        <p className="text-muted-foreground">Organize phases, deliverables, work packages, and tasks into a controlled hierarchy.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{activeProject?.projectName ?? 'Selected project'} structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item: WBSItem) => (
            <div key={item.id} className="grid gap-3 rounded-md border border-border bg-card text-card-foreground p-4 lg:grid-cols-[1fr_220px_180px]">
              <div className="flex gap-3">
                <ChevronRight className={item.parentWBSItem ? 'mt-1 h-4 w-4 text-muted-foreground' : 'mt-1 h-4 w-4 text-foreground'} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{item.wBSCode}</span>
                    <span>{item.wBSItemName}</span>
                    <Badge variant={item.priorityKey === 'Critical' ? 'destructive' : 'outline'}>{item.priorityKey}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">{item.owner.resourceName}</div>
                <div className="text-sm text-muted-foreground">{item.plannedStartDate} → {item.plannedFinishDate}</div>
              </div>
              <div>
                <div className="flex justify-between text-sm"><span>{item.statusKey}</span><span>{item.progressPercent}%</span></div>
                <Progress value={item.progressPercent} className="my-2" />
                <div className="text-xs text-muted-foreground">{item.baselineHours}h • {money.format(item.baselineCost)}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
