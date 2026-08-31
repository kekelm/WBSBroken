import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InMemoryDataBanner } from '@/generated/components/in-memory-data-banner';
import { HAS_IN_MEMORY_TABLES, useRiskList } from '@/generated/hooks';
import type { Risk } from '@/generated/models/risk-model';

const bannerMessage = "This app uses draft tables for testing. Data entered won't be saved. Contact the app owner to enable storage.";

export default function RisksPage() {
  const { data: risks } = useRiskList({ orderBy: ['dueDate asc'] });
  return (
    <div className="space-y-6 p-6">
      <InMemoryDataBanner show={HAS_IN_MEMORY_TABLES} message={bannerMessage} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Risks</h1>
        <p className="text-muted-foreground">Monitor project and WBS-level risks that can affect scope, schedule, and hours.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {(risks ?? []).map((risk: Risk) => (
          <Card key={risk.id} className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{risk.riskName}</CardTitle>
                <p className="text-sm text-muted-foreground">{risk.project.projectName}</p>
              </div>
              <Badge variant={risk.statusKey === 'Escalated' ? 'destructive' : 'secondary'}>{risk.statusKey}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{risk.mitigationPlan}</p>
              <div className="grid gap-3 md:grid-cols-4">
                <Info label="Owner" value={risk.owner.resourceName} />
                <Info label="Probability" value={risk.probabilityKey} />
                <Info label="Impact" value={risk.impactKey} />
                <Info label="Due" value={risk.dueDate} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted text-muted-foreground p-3">
      <div className="text-xs font-medium">{label}</div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}
