import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Edit, Filter, Folder, LoaderCircle, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDeleteOpportunity, useOpportunityList } from '@/generated/hooks';
import type { Opportunity } from '@/generated/models/opportunity-model';

type OpportunityFilters = {
  opportunityID: string;
  opportunityName: string;
  pursuitLead: string;
  entryType: string;
  duration: string;
};

type SortField = keyof OpportunityFilters;
type SortDirection = 'asc' | 'desc';
type OpportunitySort = { field: SortField; direction: SortDirection } | null;

const emptyFilters: OpportunityFilters = {
  opportunityID: '',
  opportunityName: '',
  pursuitLead: '',
  entryType: '',
  duration: '',
};

const sortLabels: Record<SortField, string> = {
  opportunityID: 'Opportunity ID',
  opportunityName: 'Opportunity Name',
  pursuitLead: 'Pursuit Lead',
  entryType: 'Entry Type',
  duration: 'Duration',
};

function matchesFilter(value: string | undefined, filter: string): boolean {
  return value?.toLowerCase().includes(filter.trim().toLowerCase()) ?? filter.trim().length === 0;
}

function compareValues(first: string | undefined, second: string | undefined, direction: SortDirection): number {
  const comparison = (first ?? '').localeCompare(second ?? '', undefined, { numeric: true, sensitivity: 'base' });
  return direction === 'asc' ? comparison : -comparison;
}

export default function OpportunitiesPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<OpportunityFilters>(emptyFilters);
  const [sort, setSort] = useState<OpportunitySort>({ field: 'opportunityID', direction: 'asc' });
  const opportunityQuery = useOpportunityList({ orderBy: ['opportunityID asc'] });
  const deleteOpportunity = useDeleteOpportunity();

  const filteredOpportunities = useMemo(() => {
    const matching = (opportunityQuery.data ?? []).filter((opportunity: Opportunity) =>
      matchesFilter(opportunity.opportunityID, filters.opportunityID)
      && matchesFilter(opportunity.opportunityName, filters.opportunityName)
      && matchesFilter(opportunity.pursuitLead, filters.pursuitLead)
      && matchesFilter(opportunity.entryType, filters.entryType)
      && matchesFilter(opportunity.duration, filters.duration),
    );

    if (!sort) return matching;
    return [...matching].sort((first: Opportunity, second: Opportunity) =>
      compareValues(first[sort.field], second[sort.field], sort.direction),
    );
  }, [filters, opportunityQuery.data, sort]);

  const handleSortToggle = (field: SortField) => {
    setSort((current: OpportunitySort) => {
      if (!current || current.field !== field) return { field, direction: 'asc' };
      if (current.direction === 'asc') return { field, direction: 'desc' };
      return null;
    });
  };

  const handleDelete = (opportunity: Opportunity) => {
    if (!window.confirm(`Delete opportunity ${opportunity.opportunityID}?`)) return;
    deleteOpportunity.mutate(opportunity.id, {
      onSuccess: () => toast.success('Opportunity deleted.'),
      onError: (error: Error) => toast.error(error.message || 'Unable to delete opportunity.'),
    });
  };

  const handleRefresh = () => {
    void opportunityQuery.refetch().then((result: { isSuccess: boolean }) => {
      if (result.isSuccess) toast.success('Opportunities refreshed.');
      else toast.error('Unable to retrieve opportunities.');
    });
  };

  const getSortIcon = (field: SortField) => {
    if (!sort || sort.field !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sort.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary p-2 text-primary-foreground"><Folder className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Opportunities</h1>
            <p className="text-muted-foreground">Live records retrieved from the Dataverse Opportunities table.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleRefresh} disabled={opportunityQuery.isFetching}>
            <RefreshCw className={opportunityQuery.isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Refresh
          </Button>
          <Button type="button" onClick={() => navigate('/hours')}><Plus className="h-4 w-4" /> Create New Opportunity</Button>
        </div>
      </div>

      {opportunityQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to retrieve opportunities</AlertTitle>
          <AlertDescription>{opportunityQuery.error instanceof Error ? opportunityQuery.error.message : 'The Dataverse request failed.'}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Opportunity records</CardTitle>
          <span className="text-sm text-muted-foreground">{opportunityQuery.data?.length ?? 0} records</span>
        </CardHeader>
        <CardContent>
          {opportunityQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground" role="status">
              <LoaderCircle className="h-5 w-5 animate-spin" /> Retrieving opportunities…
            </div>
          ) : (
            <div className="overflow-auto rounded-md border border-border">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="w-[96px] p-3 text-left font-medium">Actions</th>
                    {(Object.keys(sortLabels) as SortField[]).map((field: SortField) => (
                      <th key={field} className="p-3 text-left font-medium">
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleSortToggle(field)} className="h-7 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground">
                            {sortLabels[field]} {getSortIcon(field)}
                          </Button>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button type="button" variant={filters[field] ? 'secondary' : 'ghost'} size="icon-sm" aria-label={`Filter ${sortLabels[field]}`}><Filter className="h-4 w-4" /></Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-3" align="start">
                              <div className="space-y-3">
                                <p className="text-sm font-medium text-popover-foreground">Filter {sortLabels[field]}</p>
                                <Input value={filters[field]} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setFilters((current: OpportunityFilters) => ({ ...current, [field]: event.currentTarget.value }))} placeholder={`Search ${sortLabels[field]}`} />
                                <Button type="button" variant="ghost" size="sm" onClick={() => setFilters((current: OpportunityFilters) => ({ ...current, [field]: '' }))} disabled={!filters[field]}><X className="h-4 w-4" /> Clear</Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOpportunities.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No opportunities found.</td></tr>
                  ) : filteredOpportunities.map((opportunity: Opportunity) => (
                    <tr key={opportunity.id} className="border-t border-border bg-card text-card-foreground">
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="icon-sm" onClick={() => handleDelete(opportunity)} aria-label={`Delete ${opportunity.opportunityID}`}><Trash2 className="h-4 w-4" /></Button>
                          <Button type="button" variant="ghost" size="icon-sm" onClick={() => navigate(`/hours?opportunityId=${encodeURIComponent(opportunity.id)}`)} aria-label={`Edit ${opportunity.opportunityID}`}><Edit className="h-4 w-4" /></Button>
                        </div>
                      </td>
                      <td className="p-3 font-medium">{opportunity.opportunityID}</td>
                      <td className="p-3">{opportunity.opportunityName}</td>
                      <td className="p-3">{opportunity.pursuitLead ?? 'Not set'}</td>
                      <td className="p-3">{opportunity.entryType ?? 'Not set'}</td>
                      <td className="p-3">{opportunity.duration ?? 'Not set'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
