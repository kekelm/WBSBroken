import { FolderKanban } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InMemoryDataBanner } from '@/generated/components/in-memory-data-banner';
import { HAS_IN_MEMORY_TABLES, useProjectList } from '@/generated/hooks';
import type { Project } from '@/generated/models/project-model';
import { money } from '@/lib/wbs-data';

const bannerMessage = "This app uses draft tables for testing. Data entered won't be saved. Contact the app owner to enable storage.";

export default function ProjectsPage() {
  const { data: projects } = useProjectList({ orderBy: ['startDate asc'] });
  return (
    <div className="space-y-6 p-6">
      <InMemoryDataBanner show={HAS_IN_MEMORY_TABLES} message={bannerMessage} />
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage project scope containers, dates, owners, and budgets.</p>
        </div>
        <Button onClick={() => window.alert('Project intake form ready for configuration.')}>New project</Button>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {(projects ?? []).map((project: Project) => (
          <Card key={project.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{project.projectName}</CardTitle>
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </div>
              <Badge variant="secondary">{project.statusKey}</Badge>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <Info label="Manager" value={project.projectManager?.resourceName ?? 'Unassigned'} />
              <Info label="Delivery lead" value={project.deliveryLead?.resourceName ?? 'Unassigned'} />
              <Info label="Budget" value={money.format(project.budget)} />
              <Info label="Start" value={project.startDate} />
              <Info label="Finish" value={project.endDate} />
              <Info label="Created" value={project.createdDate.slice(0, 10)} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="rounded-md bg-muted text-muted-foreground p-3">
      <div className="text-xs font-medium">{label}</div>
      <div className="text-sm text-foreground">{value ?? 'Not set'}</div>
    </div>
  );
}
