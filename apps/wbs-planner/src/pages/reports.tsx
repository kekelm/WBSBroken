import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { InMemoryDataBanner } from '@/generated/components/in-memory-data-banner';
import { HAS_IN_MEMORY_TABLES, useProjectList, useResourceHourEntryList, useWBSItemList } from '@/generated/hooks';
import type { WBSItem } from '@/generated/models/wbs-item-model';
import { findProject, itemActualHours, number, projectHours, projectItems } from '@/lib/wbs-data';

const bannerMessage = "This app uses draft tables for testing. Data entered won't be saved. Contact the app owner to enable storage.";
const chartConfig = {
  planned: { label: 'Planned', color: 'var(--chart-1)' },
  actual: { label: 'Actual', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export default function ReportsPage() {
  const { data: projects } = useProjectList();
  const { data: wbsItems } = useWBSItemList({ orderBy: ['wBSCode asc'] });
  const { data: hours } = useResourceHourEntryList();
  const activeProject = findProject(projects);
  const entries = projectHours(hours, activeProject);
  const chartData = projectItems(wbsItems, activeProject).map((item: WBSItem) => ({
    name: item.wBSCode,
    planned: item.baselineHours,
    actual: itemActualHours(entries, item),
  }));
  return (
    <div className="space-y-6 p-6">
      <InMemoryDataBanner show={HAS_IN_MEMORY_TABLES} message={bannerMessage} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Export-ready project controls summaries for planned and actual WBS effort.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Planned vs actual hours</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[320px] w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="planned" fill="var(--chart-1)" radius={4} />
              <Bar dataKey="actual" fill="var(--chart-2)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Variance table</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-md border border-border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted text-muted-foreground"><tr><th className="p-3 text-left">WBS</th><th className="p-3 text-right">Planned</th><th className="p-3 text-right">Actual</th><th className="p-3 text-right">Variance</th></tr></thead>
              <tbody>{chartData.map((row: { name: string; planned: number; actual: number }) => <tr key={row.name} className="border-t border-border"><td className="p-3">{row.name}</td><td className="p-3 text-right">{number.format(row.planned)}</td><td className="p-3 text-right">{number.format(row.actual)}</td><td className="p-3 text-right font-semibold">{number.format(row.actual - row.planned)}</td></tr>)}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
