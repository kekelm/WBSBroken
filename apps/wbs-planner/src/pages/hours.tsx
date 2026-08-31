import { useCallback, useEffect, useMemo, useState } from 'react';

import { addMonths, addWeeks, format, startOfMonth } from 'date-fns';
import { CalendarIcon, Check, ChevronsUpDown, Loader2, Save, Trash2, UserRound, Wrench, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { User } from '@/generated/models/Office365UsersModel';
import { useM365PeopleSearch } from '@/hooks/use-m365-people-search';
import { useCreateOpportunity, useCreateResource, useCreateResourceHours, useCreateResourceSkillsets, useCreateStaffingPlanResources, useCreateTimePeriod, useDeleteResourceHours, useDeleteResourceSkillsets, useDeleteStaffingPlanResources, useDeleteTimePeriod, useLaborCategoryList, useLevel1SkillsetNamesList, useLevel2SkillsetNamesList, useOpportunityList, useProjectList, useResourceHoursList, useResourceList, useResourceSkillsetsList, useSolutionAreaList, useSolutionAreaSkillsetsList, useStaffingPlanResourcesList, useTimePeriodList, useUpdateOpportunity, useUpdateResourceHours, useUpdateResourceSkillsets, useUpdateStaffingPlanResources, useUpdateTimePeriod } from '@/generated/hooks';
import type { LaborCategory } from '@/generated/models/labor-category-model';
import type { Level1SkillsetNames } from '@/generated/models/level1skillset-names-model';
import type { Level2SkillsetNames } from '@/generated/models/level2skillset-names-model';

import type { SolutionArea } from '@/generated/models/solution-area-model';
import type { SolutionAreaSkillsets } from '@/generated/models/solution-area-skillsets-model';
import type { Opportunity } from '@/generated/models/opportunity-model';
import type { StaffingPlanResources } from '@/generated/models/staffing-plan-resources-model';
import type { ResourceSkillsets } from '@/generated/models/resource-skillsets-model';
import type { Resource } from '@/generated/models/resource-model';

import type { ResourceHours } from '@/generated/models/resource-hours-model';
import type { TimePeriod } from '@/generated/models/time-period-model';
import { findProject, number, sumBy } from '@/lib/wbs-data';


type EntryMode = 'Weekly' | 'Monthly';

type GridPeriod = { id: string; timePeriodName: string; startDate: string; endDate: string; periodNumber: number };

const locationOptions = ['remote', 'onsite', 'remote/onsite'] as const;
const clearanceLevelOptions = ['No Clearance Needed', 'High +', 'High', 'Medium', 'Low'] as const;
const skillsetIdentifiers = ['Primary', 'Secondary Skill 1', 'Secondary Skillset 2'] as const;

type SkillsetIdentifier = (typeof skillsetIdentifiers)[number];
type SkillsetRow = {
  id: string;
  identifier: SkillsetIdentifier;
  functionalProductTechnical: string;
  level1SkillsetName: string;
  level2SkillsetName: string;
};

function createEmptySkillsets(): SkillsetRow[] {
  return skillsetIdentifiers.map((identifier: SkillsetIdentifier) => ({
    id: createTemporaryResourceRowId(),
    identifier,
    functionalProductTechnical: '',
    level1SkillsetName: '',
    level2SkillsetName: '',
  }));
}
function durationBounds(mode: EntryMode): { min: number; max: number; defaultValue: number } {
  return mode === 'Monthly' ? { min: 13, max: 24, defaultValue: 13 } : { min: 1, max: 52, defaultValue: 6 };
}

function clampDuration(value: number, mode: EntryMode): number {
  const bounds = durationBounds(mode);
  return Math.max(bounds.min, Math.min(value, bounds.max));
}

function createTemporaryResourceRowId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `temp-${crypto.randomUUID()}`;
  }

  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isTemporaryResourceRowId(rowId: string): boolean {
  return rowId.startsWith('temp-');
}

function remapRecordKeys<T>(record: Record<string, T>, rowIdMap: Record<string, string>): Record<string, T> {
  return Object.entries(record).reduce((nextRecord: Record<string, T>, [rowId, value]: [string, T]) => {
    nextRecord[rowIdMap[rowId] ?? rowId] = value;
    return nextRecord;
  }, {});
}

function remapGridValueKeys(record: Record<string, string>, rowIdMap: Record<string, string>, periods: GridPeriod[]): Record<string, string> {
  return Object.entries(record).reduce((nextRecord: Record<string, string>, [cellKey, value]: [string, string]) => {
    const matchingRowId = Object.keys(rowIdMap).find((rowId: string) => periods.some((period: GridPeriod) => cellKey === `${rowId}-${period.id}`));

    if (!matchingRowId) {
      nextRecord[cellKey] = value;
      return nextRecord;
    }

    const period = periods.find((gridPeriod: GridPeriod) => cellKey === `${matchingRowId}-${gridPeriod.id}`);
    if (period) {
      nextRecord[`${rowIdMap[matchingRowId]}-${period.id}`] = value;
    }

    return nextRecord;
  }, {});
}

function getResourceSkillsetStaffingResourceId(skillset: ResourceSkillsets): string | undefined {
  return skillset.staffingPlanResource?.id ?? skillset.staffingPlanResources?.id;
}
function buildDurationPeriods(mode: EntryMode, duration: number, startDate: Date | undefined): GridPeriod[] {
  const safeDuration = clampDuration(duration, mode);
  const baseDate = startDate ?? new Date();
  const normalizedDate = mode === 'Monthly' ? startOfMonth(baseDate) : baseDate;

  return Array.from({ length: safeDuration }, (_value: unknown, index: number) => {
    const periodStart = mode === 'Monthly' ? addMonths(normalizedDate, index) : addWeeks(normalizedDate, index);
    const periodEnd = mode === 'Monthly' ? addMonths(periodStart, 1) : addWeeks(periodStart, 1);
    const label = mode === 'Monthly' ? format(periodStart, 'MMM yyyy') : `Week ${index + 1} · ${format(periodStart, 'MMM d')}`;

    return {
      id: `${mode.toLowerCase()}-${format(periodStart, 'yyyy-MM-dd')}`,
      timePeriodName: label,
      startDate: format(periodStart, 'yyyy-MM-dd'),
      endDate: format(periodEnd, 'yyyy-MM-dd'),
      periodNumber: index + 1,
    };
  });
}

export default function HoursPage() {
  const [mode, setMode] = useState<EntryMode>('Weekly');
  const [duration, setDuration] = useState<number>(6);
  const [resourceRows, setResourceRows] = useState<string[]>([]);
  const [selectedResources, setSelectedResources] = useState<Record<string, string>>({});
  const [gridValues, setGridValues] = useState<Record<string, string>>({});
  const [opportunityId, setOpportunityId] = useState<string>('');
  const [opportunityOwner, setOpportunityOwner] = useState<User | undefined>();

  const [opportunityName, setOpportunityName] = useState<string>('');
  const [pursuitLead, setPursuitLead] = useState<string>('');
  const [architects, setArchitects] = useState<string>('');
  const [resourceNames, setResourceNames] = useState<Record<string, string>>({});
  const [selectedLocations, setSelectedLocations] = useState<Record<string, string>>({});
  const [selectedSolutionAreas, setSelectedSolutionAreas] = useState<Record<string, string>>({});
  const [clearanceLevel, setClearanceLevel] = useState<string>('No Clearance Needed');
  const [deletedStaffingPlanResourceIds, setDeletedStaffingPlanResourceIds] = useState<string[]>([]);
  const [projectStartDate, setProjectStartDate] = useState<Date>();
  const [priceToWin, setPriceToWin] = useState<string>('');

  const [skillsetsRowId, setSkillsetsRowId] = useState<string | undefined>();
  const [projectEndDate, setProjectEndDate] = useState<Date>();
  const { data: projects } = useProjectList();

  const [savedSkillsets, setSavedSkillsets] = useState<Record<string, SkillsetRow[]>>({});
  const [draftSkillsets, setDraftSkillsets] = useState<SkillsetRow[]>(createEmptySkillsets());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [pendingMode, setPendingMode] = useState<EntryMode | undefined>();
  const [isResettingEntryType, setIsResettingEntryType] = useState<boolean>(false);
  const [isSavingNavigation, setIsSavingNavigation] = useState<boolean>(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { data: opportunities } = useOpportunityList();
  const { data: staffingPlanResources } = useStaffingPlanResourcesList();
  const { data: laborCategories } = useLaborCategoryList({ orderBy: ['laborCategoryName asc'] });

  const { data: solutionAreas } = useSolutionAreaList({ orderBy: ['solutionArea asc'] });
  const { data: solutionAreaSkillsets } = useSolutionAreaSkillsetsList({ orderBy: ['skillsetArea asc'] });
  const { data: timePeriods } = useTimePeriodList();
  const { data: resources } = useResourceList();
  const { data: resourceHours } = useResourceHoursList();
  const { data: level1SkillsetNames } = useLevel1SkillsetNamesList({ orderBy: ['level1SkillsetName asc'] });
  const { data: resourceSkillsets } = useResourceSkillsetsList();
  const { data: level2SkillsetNames } = useLevel2SkillsetNamesList({ orderBy: ['level2SkillsetName asc'] });
  const activeProject = findProject(projects);
  const projectDateValidationMessage = projectStartDate && projectEndDate && projectEndDate < projectStartDate
    ? 'Project End Date cannot be before Project Start Date.'
    : undefined;


  const activeLaborCategories = useMemo(() => {
    return (laborCategories ?? []).filter((laborCategory: LaborCategory) => laborCategory.id && laborCategory.laborCategoryName);
  }, [laborCategories]);
  const activePeriods = useMemo(() => buildDurationPeriods(mode, duration, projectStartDate), [mode, duration, projectStartDate]);

  const activeSolutionAreas = useMemo(() => {
    return (solutionAreas ?? []).filter((solutionArea: SolutionArea) => solutionArea.id && solutionArea.solutionArea);
  }, [solutionAreas]);
  const activeLevel1SkillsetNames = useMemo(() => {
    return (level1SkillsetNames ?? []).filter((level1Skillset: Level1SkillsetNames) => level1Skillset.id && level1Skillset.level1SkillsetName && level1Skillset.solutionAreaSkillsets?.id);
  }, [level1SkillsetNames]);
  const activeLevel2SkillsetNames = useMemo(() => {
    return (level2SkillsetNames ?? []).filter((level2Skillset: Level2SkillsetNames) => level2Skillset.id && level2Skillset.level2SkillsetName && level2Skillset.level1SkillsetNames?.id);
  }, [level2SkillsetNames]);
  const activeSolutionAreaSkillsets = useMemo(() => {
    return (solutionAreaSkillsets ?? []).filter((skillset: SolutionAreaSkillsets) => skillset.id && skillset.skillsetArea && skillset.solutionArea?.id);
  }, [solutionAreaSkillsets]);
  const rowTotals = useMemo(() => {
    return resourceRows.reduce((totals: Record<string, number>, rowId: string) => {
      totals[rowId] = sumBy(activePeriods, (period: GridPeriod) => Number.parseFloat(gridValues[`${rowId}-${period.id}`] ?? '0') || 0);
      return totals;
    }, {});
  }, [activePeriods, gridValues, resourceRows]);
  const periodTotals = useMemo(() => {
    return activePeriods.reduce((totals: Record<string, { total: number; hasValue: boolean }>, period: GridPeriod) => {
      totals[period.id] = resourceRows.reduce((periodTotal: { total: number; hasValue: boolean }, rowId: string) => {
        const cellValue = gridValues[`${rowId}-${period.id}`] ?? '';
        const parsedValue = Number.parseFloat(cellValue);
        return {
          total: periodTotal.total + (Number.isNaN(parsedValue) ? 0 : parsedValue),
          hasValue: periodTotal.hasValue || cellValue.trim().length > 0,
        };
      }, { total: 0, hasValue: false });
      return totals;
    }, {});
  }, [activePeriods, gridValues, resourceRows]);
  const overallResourceHours = resourceRows.reduce((total: number, rowId: string) => total + (rowTotals[rowId] ?? 0), 0);
  const currency = useMemo(() => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }), []);
  const wholeDollarCurrency = useMemo(() => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }), []);
  const laborCategoryRateById = useMemo(() => {
    return activeLaborCategories.reduce((rates: Record<string, { billRate: number; costRate: number }>, laborCategory: LaborCategory) => {
      rates[laborCategory.id] = { billRate: laborCategory.laborBillRate, costRate: laborCategory.laborCostRate };
      return rates;
    }, {});
  }, [activeLaborCategories]);
  const gridTotalAllocation = resourceRows.reduce((total: number, rowId: string) => {
    const rowTotal = rowTotals[rowId] ?? 0;
    return total + (overallResourceHours > 0 && rowTotal > 0 ? (rowTotal / overallResourceHours) * 100 : 0);
  }, 0);
  const gridTotalRevenue = resourceRows.reduce((total: number, rowId: string) => {
    const rowTotal = rowTotals[rowId] ?? 0;
    const laborCategoryRates = laborCategoryRateById[selectedResources[rowId] ?? ''];
    return total + rowTotal * (laborCategoryRates?.billRate ?? 0);
  }, 0);

  const createOpportunity = useCreateOpportunity();
  const updateOpportunity = useUpdateOpportunity();
  const createStaffingPlanResource = useCreateStaffingPlanResources();
  const createResource = useCreateResource();
  const createTimePeriod = useCreateTimePeriod();
  const updateTimePeriod = useUpdateTimePeriod();
  const deleteTimePeriod = useDeleteTimePeriod();
  const createResourceHours = useCreateResourceHours();
  const updateResourceHours = useUpdateResourceHours();
  const deleteResourceHours = useDeleteResourceHours();
  const createResourceSkillset = useCreateResourceSkillsets();
  const updateResourceSkillset = useUpdateResourceSkillsets();
  const deleteResourceSkillset = useDeleteResourceSkillsets();
  const updateStaffingPlanResource = useUpdateStaffingPlanResources();


  const deleteStaffingPlanResource = useDeleteStaffingPlanResources();
  const bounds = durationBounds(mode);

  const markUnsaved = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  useEffect(() => {
    const selectedOpportunityId = searchParams.get('opportunityId');
    if (!selectedOpportunityId || !opportunities || !staffingPlanResources) {
      return;
    }

    const selectedOpportunity = opportunities.find((opportunity: Opportunity) => opportunity.id === selectedOpportunityId);
    if (!selectedOpportunity) {
      return;
    }

    const relatedResources = staffingPlanResources.filter((resource: StaffingPlanResources) => resource.opportunity?.id === selectedOpportunity.id);
    const nextSelectedResources = relatedResources.reduce((values: Record<string, string>, resource: StaffingPlanResources) => {
      if (resource.laborCategory?.id) {
        values[resource.id] = resource.laborCategory.id;
      }
      return values;
    }, {});
    const nextSelectedSolutionAreas = relatedResources.reduce((values: Record<string, string>, resource: StaffingPlanResources) => {
      if (resource.solutionArea?.id) {
        values[resource.id] = resource.solutionArea.id;
      }
      return values;
    }, {});
    const nextResourceNames = relatedResources.reduce((values: Record<string, string>, resource: StaffingPlanResources) => {
      values[resource.id] = (resource.resourceNotes ?? '').split(' · ')[0] || '';
      return values;
    }, {});
    const nextSelectedLocations = relatedResources.reduce((values: Record<string, string>, resource: StaffingPlanResources) => {
      values[resource.id] = resource.resourceLocation ?? locationOptions[0];
      return values;
    }, {});

    setOpportunityId(selectedOpportunity.opportunityID);
    setOpportunityName(selectedOpportunity.opportunityName);
    setPursuitLead(selectedOpportunity.pursuitLead ?? '');
    setArchitects(selectedOpportunity.architect ?? '');
    setClearanceLevel(selectedOpportunity.clearanceLevelKey ?? 'No Clearance Needed');
    setPriceToWin(selectedOpportunity.priceToWin === undefined ? '' : String(Math.round(selectedOpportunity.priceToWin)));
    const savedEntryMode: EntryMode = selectedOpportunity.entryType === 'Monthly' ? 'Monthly' : 'Weekly';
    const savedDuration = Number.parseInt(selectedOpportunity.duration ?? '', 10);
    setMode(savedEntryMode);
    setDuration(Number.isNaN(savedDuration) ? durationBounds(savedEntryMode).defaultValue : clampDuration(savedDuration, savedEntryMode));
    setProjectStartDate(selectedOpportunity.projectStartDate ? new Date(`${selectedOpportunity.projectStartDate}T00:00:00`) : undefined);
    setProjectEndDate(selectedOpportunity.projectEndDate ? new Date(`${selectedOpportunity.projectEndDate}T00:00:00`) : undefined);
    setResourceRows(relatedResources.map((resource: StaffingPlanResources) => resource.id));
    setSelectedResources(nextSelectedResources);
    setSelectedSolutionAreas(nextSelectedSolutionAreas);
    setResourceNames(nextResourceNames);
    setSelectedLocations(nextSelectedLocations);
    const nextSavedSkillsets = relatedResources.reduce((values: Record<string, SkillsetRow[]>, resource: StaffingPlanResources) => {
      const matchingSkillsets = (resourceSkillsets ?? []).filter((skillset: ResourceSkillsets) => {
        return getResourceSkillsetStaffingResourceId(skillset) === resource.id;
      });
      values[resource.id] = skillsetIdentifiers.map((identifier: SkillsetIdentifier) => {
        const savedSkillset = matchingSkillsets.find((skillset: ResourceSkillsets) => skillset.skillsetIdentifier === identifier);
        const savedLevel1SkillsetId = savedSkillset?.level1SkillsetName?.id ?? '';
        const savedLevel2SkillsetId = savedSkillset?.level2SkillsetName?.id ?? '';
        return {
          id: savedSkillset?.id ?? createTemporaryResourceRowId(),
          identifier,
          functionalProductTechnical: savedSkillset?.skillsetType ?? '',
          level1SkillsetName: savedLevel1SkillsetId,
          level2SkillsetName: savedLevel2SkillsetId,
        };
      });
      return values;
    }, {});
    const relatedPeriods = (timePeriods ?? []).filter((period: TimePeriod) => period.opportunity?.id === selectedOpportunity.id);
    const nextGridValues = (resourceHours ?? []).reduce((values: Record<string, string>, hourEntry: ResourceHours) => {
      const staffingResourceId = hourEntry.staffingPlanResources?.id;
      const matchingPeriod = relatedPeriods.find((period: TimePeriod) => period.id === hourEntry.timePeriod.id);
      if (staffingResourceId && matchingPeriod) {
        values[`${staffingResourceId}-${savedEntryMode.toLowerCase()}-${matchingPeriod.startDate}`] = hourEntry.hours;
      }
      return values;
    }, {});

    setGridValues(nextGridValues);
    setSavedSkillsets(nextSavedSkillsets);
    setDeletedStaffingPlanResourceIds([]);
    setHasUnsavedChanges(false);
  }, [opportunities, resourceHours, resourceSkillsets, searchParams, staffingPlanResources, timePeriods]);

  const saveStaffingPlan = useCallback(async () => {
    const trimmedOpportunityId = opportunityId.trim();
    const trimmedOpportunityName = opportunityName.trim();

    if (projectDateValidationMessage) {
      toast.error(projectDateValidationMessage);
      return;
    }
    if (!pursuitLead.trim()) {
      toast.error('Pursuit Lead is required before saving.');
      throw new Error('A Pursuit Lead is required.');
    }


    if (!trimmedOpportunityName) {
      toast.error('Opportunity Name is required before saving.');
      return;
    }

    const parsedPriceToWin = priceToWin.trim() ? Number.parseInt(priceToWin, 10) : undefined;


    const opportunityRecord = {
      opportunityID: trimmedOpportunityId || trimmedOpportunityName,
      opportunityName: trimmedOpportunityName,
      clearanceLevelKey: clearanceLevel === 'No Clearance Needed' ? undefined : clearanceLevel,
      duration: String(duration),
      entryType: mode,
      priceToWin: parsedPriceToWin,
      projectStartDate: projectStartDate ? format(projectStartDate, 'yyyy-MM-dd') : undefined,
      projectEndDate: projectEndDate ? format(projectEndDate, 'yyyy-MM-dd') : undefined,
      pursuitLead: pursuitLead.trim() || undefined,
      architect: architects.trim() || undefined,
    };

    const existingOpportunity = (opportunities ?? []).find((opportunity: Opportunity) => opportunity.opportunityID === opportunityRecord.opportunityID);
    const savedOpportunity = existingOpportunity
      ? await updateOpportunity.mutateAsync({ id: existingOpportunity.id, changedFields: opportunityRecord })
      : await createOpportunity.mutateAsync(opportunityRecord);

    const rowIdMap: Record<string, string> = {};

    await Promise.all(deletedStaffingPlanResourceIds.map((resourceId: string) => deleteStaffingPlanResource.mutateAsync(resourceId)));

    const savedResources = await Promise.all(resourceRows.map(async (rowId: string, index: number) => {
      const selectedLaborCategory = activeLaborCategories.find((laborCategory: LaborCategory) => laborCategory.id === selectedResources[rowId]);
      const selectedSolutionArea = activeSolutionAreas.find((solutionArea: SolutionArea) => solutionArea.id === selectedSolutionAreas[rowId]);
      const noteParts = [
        resourceNames[rowId]?.trim() || `Resource ${index + 1}`,
        selectedLaborCategory?.laborCategoryName,
        selectedSolutionArea?.solutionArea,
      ].filter((part: string | undefined): part is string => Boolean(part));
      const resourceRecord = {
        resourceNotes: noteParts.join(' · '),
        laborCategory: selectedLaborCategory ? { id: selectedLaborCategory.id, laborCategoryName: selectedLaborCategory.laborCategoryName } : undefined,
        opportunity: { id: savedOpportunity.id, opportunityID: savedOpportunity.opportunityID },
        resourceLocation: selectedLocations[rowId] ?? locationOptions[0],
        solutionArea: selectedSolutionArea ? { id: selectedSolutionArea.id, solutionArea: selectedSolutionArea.solutionArea } : undefined,
      };

      const existingStaffingResource = !isTemporaryResourceRowId(rowId)
        ? (staffingPlanResources ?? []).find((resource: StaffingPlanResources) => resource.id === rowId)
        : undefined;
      const savedResource = existingStaffingResource
        ? await updateStaffingPlanResource.mutateAsync({ id: rowId, changedFields: resourceRecord })
        : await createStaffingPlanResource.mutateAsync(resourceRecord);

      const existingSkillsets = (resourceSkillsets ?? []).filter((skillset: ResourceSkillsets) => {
        return getResourceSkillsetStaffingResourceId(skillset) === savedResource.id;
      });
      const rowSkillsets = savedSkillsets[rowId] ?? [];
      const populatedSkillsets = rowSkillsets.filter((skillset: SkillsetRow) => {
        return Boolean(skillset.functionalProductTechnical || skillset.level1SkillsetName || skillset.level2SkillsetName);
      });
      const desiredIdentifiers = new Set(populatedSkillsets.map((skillset: SkillsetRow) => skillset.identifier));

      await Promise.all(existingSkillsets.filter((skillset: ResourceSkillsets) => {
        return !skillset.skillsetIdentifier || !desiredIdentifiers.has(skillset.skillsetIdentifier as SkillsetIdentifier);
      }).map((skillset: ResourceSkillsets) => deleteResourceSkillset.mutateAsync(skillset.id)));

      await Promise.all(populatedSkillsets.map((skillset: SkillsetRow) => {
        const selectedSolutionAreaSkillset = activeSolutionAreaSkillsets.find((option: SolutionAreaSkillsets) => getSkillsetAreaValue(option) === skillset.functionalProductTechnical);
        const selectedLevel1Skillset = activeLevel1SkillsetNames.find((option: Level1SkillsetNames) => option.id === skillset.level1SkillsetName);
        const selectedLevel2Skillset = activeLevel2SkillsetNames.find((option: Level2SkillsetNames) => option.id === skillset.level2SkillsetName);
        const skillsetRecord = {
          skillsetIdentifier: skillset.identifier,
          skillsetType: skillset.functionalProductTechnical || undefined,
          level1SkillsetName: selectedLevel1Skillset ? { id: selectedLevel1Skillset.id, level1SkillsetSolutionAreaSkillsetsKey: selectedLevel1Skillset.level1SkillsetSolutionAreaSkillsetsKey } : undefined,
          level2SkillsetName: selectedLevel2Skillset ? { id: selectedLevel2Skillset.id, level2SkillsetName: selectedLevel2Skillset.level2SkillsetName } : undefined,
          solutionArea: selectedSolutionArea ? { id: selectedSolutionArea.id, solutionArea: selectedSolutionArea.solutionArea } : undefined,
          solutionAreaSkillset: selectedSolutionAreaSkillset ? { id: selectedSolutionAreaSkillset.id, skillsetAreaSolutionAreaKey: selectedSolutionAreaSkillset.skillsetAreaSolutionAreaKey } : undefined,
          staffingPlanResource: { id: savedResource.id, resourceNotes: savedResource.resourceNotes },
          staffingPlanResources: { id: savedResource.id, resourceNotes: savedResource.resourceNotes },
        };
        const matchingSkillset = existingSkillsets.find((existingSkillset: ResourceSkillsets) => {
          return existingSkillset.id === skillset.id || existingSkillset.skillsetIdentifier === skillset.identifier;
        });

        return matchingSkillset
          ? updateResourceSkillset.mutateAsync({ id: matchingSkillset.id, changedFields: skillsetRecord })
          : createResourceSkillset.mutateAsync(skillsetRecord);
      }));

      return { originalRowId: rowId, savedRowId: savedResource.id };
    }));

    savedResources.forEach(({ originalRowId, savedRowId }: { originalRowId: string; savedRowId: string }) => {
      rowIdMap[originalRowId] = savedRowId;
    });

    const savedPeriodRecords = await Promise.all(activePeriods.map(async (period: GridPeriod) => {
      const fiscalYear = Number.parseInt(period.startDate.slice(0, 4), 10);
      const existingPeriod = (timePeriods ?? []).find((timePeriod: TimePeriod) => {
        return timePeriod.opportunity?.id === savedOpportunity.id && timePeriod.startDate === period.startDate && timePeriod.endDate === period.endDate;
      });
      const periodRecord = {
        timePeriodName: period.timePeriodName,
        startDate: period.startDate,
        endDate: period.endDate,
        fiscalYear,
        opportunity: { id: savedOpportunity.id, opportunityID: savedOpportunity.opportunityID },
        periodNumber: period.periodNumber,
        periodTypeKey: mode,
        statusKey: 'Open' as const,
      };

      const savedPeriod = existingPeriod
        ? await updateTimePeriod.mutateAsync({ id: existingPeriod.id, changedFields: periodRecord })
        : await createTimePeriod.mutateAsync(periodRecord);

      return { gridPeriodId: period.id, savedPeriod };
    }));

    const savedPeriodByGridId = savedPeriodRecords.reduce((values: Record<string, TimePeriod>, periodRecord: { gridPeriodId: string; savedPeriod: TimePeriod }) => {
      values[periodRecord.gridPeriodId] = periodRecord.savedPeriod;
      return values;
    }, {});

    await Promise.all(savedResources.map(async ({ originalRowId, savedRowId }: { originalRowId: string; savedRowId: string }) => {
      const selectedLaborCategory = activeLaborCategories.find((laborCategory: LaborCategory) => laborCategory.id === selectedResources[originalRowId]);
      const resourceName = savedRowId;
      const existingResource = (resources ?? []).find((resource: Resource) => resource.resourceName === resourceName);

      if (!existingResource) {
        await createResource.mutateAsync({
          resourceName,
          costRate: selectedLaborCategory?.laborCostRate ?? 0,
          email: `${savedRowId}@example.com`,
          resourceRoleKey: 'Developer',
          statusKey: 'Active',
          weeklyCapacityHours: 40,
        });
      }
    }));

    await Promise.all(resourceRows.flatMap((rowId: string) => {
      const savedRowId = rowIdMap[rowId] ?? rowId;
      const savedResourceMatch = savedResources.find((resource: { originalRowId: string; savedRowId: string }) => resource.savedRowId === savedRowId);
      const resourceNotes = savedResourceMatch ? resourceNames[rowId] ?? savedRowId : resourceNames[rowId] ?? savedRowId;
      return activePeriods.map((period: GridPeriod) => {
        const savedPeriod = savedPeriodByGridId[period.id];
        const cellValue = gridValues[`${rowId}-${period.id}`]?.trim() ?? '';
        const parsedHours = Number.parseFloat(cellValue);
        const existingHour = (resourceHours ?? []).find((hourEntry: ResourceHours) => {
          return hourEntry.opportunityID?.id === savedOpportunity.id && hourEntry.staffingPlanResources?.id === savedRowId && hourEntry.timePeriod.id === savedPeriod.id;
        });

        if (!cellValue || Number.isNaN(parsedHours) || parsedHours <= 0) {
          return existingHour ? deleteResourceHours.mutateAsync(existingHour.id) : Promise.resolve(undefined);
        }

        const hourRecord = {
          hours: String(parsedHours),
          opportunityID: { id: savedOpportunity.id, opportunityID: savedOpportunity.opportunityID },
          staffingPlanResources: { id: savedRowId, resourceNotes },
          timePeriod: { id: savedPeriod.id, timePeriodName: savedPeriod.timePeriodName },
        };

        return existingHour
          ? updateResourceHours.mutateAsync({ id: existingHour.id, changedFields: hourRecord })
          : createResourceHours.mutateAsync(hourRecord);
      });
    }));

    setResourceRows((currentRows: string[]) => {
      setSelectedResources((current: Record<string, string>) => remapRecordKeys(current, rowIdMap));
      setResourceNames((current: Record<string, string>) => remapRecordKeys(current, rowIdMap));
      setSelectedLocations((current: Record<string, string>) => remapRecordKeys(current, rowIdMap));
      setSelectedSolutionAreas((current: Record<string, string>) => remapRecordKeys(current, rowIdMap));
      setSavedSkillsets((current: Record<string, SkillsetRow[]>) => remapRecordKeys(current, rowIdMap));
      setGridValues((current: Record<string, string>) => remapGridValueKeys(current, rowIdMap, activePeriods));
      setSkillsetsRowId((current: string | undefined) => (current ? rowIdMap[current] ?? current : undefined));

      return currentRows.map((rowId: string) => rowIdMap[rowId] ?? rowId);
    });

    setDeletedStaffingPlanResourceIds([]);
    setHasUnsavedChanges(false);
    toast.success(`Opportunity ${trimmedOpportunityId || trimmedOpportunityName} saved with staffing resources, time periods, and resource hours.`);
  }, [activeLaborCategories, activeLevel1SkillsetNames, activeLevel2SkillsetNames, activePeriods, activeSolutionAreaSkillsets, activeSolutionAreas, architects, clearanceLevel, createOpportunity, createResource, createResourceHours, createResourceSkillset, createStaffingPlanResource, createTimePeriod, deleteResourceHours, deleteResourceSkillset, deleteStaffingPlanResource, deletedStaffingPlanResourceIds, duration, gridValues, mode, opportunities, opportunityId, opportunityName, priceToWin, projectDateValidationMessage, projectEndDate, projectStartDate, pursuitLead, resourceHours, resourceNames, resourceRows, resourceSkillsets, resources, savedSkillsets, selectedLocations, selectedResources, selectedSolutionAreas, staffingPlanResources, timePeriods, updateOpportunity, updateResourceHours, updateResourceSkillset, updateStaffingPlanResource, updateTimePeriod]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null;

      if (!(target instanceof HTMLAnchorElement)) {
        return;
      }

      const targetUrl = new URL(target.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      const isSameOrigin = targetUrl.origin === currentUrl.origin;
      const nextPath = `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
      const currentPath = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;

      if (!isSameOrigin || nextPath === currentPath || currentUrl.pathname !== '/hours') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setIsSavingNavigation(true);
      saveStaffingPlan()
        .then(() => {
          navigate(nextPath);
        })
        .catch((error: unknown) => {
          toast.error(error instanceof Error ? error.message : 'Unable to save staffing plan changes.');
        })
        .finally(() => {
          setIsSavingNavigation(false);
        });
    };

    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };


  }, [hasUnsavedChanges, navigate, saveStaffingPlan]);

  const handleSelectedResourceChange = (rowId: string, value: string) => {
    markUnsaved();
    setSelectedResources((current: Record<string, string>) => ({ ...current, [rowId]: value }));
  };


  const handleResourceNameChange = (rowId: string, value: string) => {
    markUnsaved();
    setResourceNames((current: Record<string, string>) => ({ ...current, [rowId]: value }));
  };

  const handleLocationChange = (rowId: string, value: string) => {
    markUnsaved();
    setSelectedLocations((current: Record<string, string>) => ({ ...current, [rowId]: value }));
  };

  const handleOpportunityIdChange = (value: string) => {
    markUnsaved();
    setOpportunityId(value);
  };

  const handleOpportunityNameChange = (value: string) => {
    markUnsaved();
    setOpportunityName(value);
  };

  const handlePriceToWinChange = (value: string) => {
    markUnsaved();
    setPriceToWin(value.replace(/\D/g, ''));
  };


  const handleSolutionAreaChange = (rowId: string, value: string) => {
    markUnsaved();
    setSelectedSolutionAreas((current: Record<string, string>) => ({ ...current, [rowId]: value }));
    setSavedSkillsets((current: Record<string, SkillsetRow[]>) => {
      const nextSkillsets = { ...current };
      delete nextSkillsets[rowId];
      return nextSkillsets;
    });
    if (skillsetsRowId === rowId) {
      setDraftSkillsets(createEmptySkillsets());
    }
  };

  const handleClearanceLevelChange = (value: string) => {
    markUnsaved();
    setClearanceLevel(value);
  };
  const handleGridValueChange = (cellKey: string, value: string) => {
    markUnsaved();
    setGridValues((current: Record<string, string>) => ({ ...current, [cellKey]: value }));
  };

  const handlePursuitLeadChange = (value: string) => {
    markUnsaved();
    setPursuitLead(value);
  };

  const handleArchitectsChange = (value: string) => {
    markUnsaved();
    setArchitects(value);
  };

  const handleDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextDuration = Number.parseInt(event.currentTarget.value, 10);
    markUnsaved();
    setDuration(Number.isNaN(nextDuration) ? bounds.min : clampDuration(nextDuration, mode));
  };

  const applyModeChange = (value: EntryMode) => {
    setMode(value);
    setDuration(durationBounds(value).defaultValue);
    setGridValues({});
    setHasUnsavedChanges(true);
  };

  const handleModeChange = (value: EntryMode) => {
    if (value === mode || isResettingEntryType) {
      return;
    }

    const selectedOpportunityId = searchParams.get('opportunityId');
    const hasGridValues = Object.values(gridValues).some((cellValue: string) => cellValue.trim().length > 0);
    if (selectedOpportunityId || hasGridValues) {
      setPendingMode(value);
      return;
    }

    applyModeChange(value);
  };

  const handleConfirmModeChange = async () => {
    if (!pendingMode) {
      return;
    }

    const nextMode = pendingMode;
    const selectedOpportunityId = searchParams.get('opportunityId');
    const selectedOpportunity = (opportunities ?? []).find((opportunity: Opportunity) => opportunity.id === selectedOpportunityId);
    setIsResettingEntryType(true);

    try {
      if (selectedOpportunity) {
        const relatedPeriods = (timePeriods ?? []).filter((period: TimePeriod) => period.opportunity?.id === selectedOpportunity.id);
        const relatedPeriodIds = new Set(relatedPeriods.map((period: TimePeriod) => period.id));
        const relatedHours = (resourceHours ?? []).filter((hourEntry: ResourceHours) => {
          return hourEntry.opportunityID?.id === selectedOpportunity.id || relatedPeriodIds.has(hourEntry.timePeriod.id);
        });

        await Promise.all(relatedHours.map((hourEntry: ResourceHours) => deleteResourceHours.mutateAsync(hourEntry.id)));
        await Promise.all(relatedPeriods.map((period: TimePeriod) => deleteTimePeriod.mutateAsync(period.id)));
        await updateOpportunity.mutateAsync({
          id: selectedOpportunity.id,
          changedFields: { entryType: nextMode, duration: String(durationBounds(nextMode).defaultValue) },
        });
      }

      applyModeChange(nextMode);
      setPendingMode(undefined);
      toast.success(`Entry Type changed to ${nextMode} Entry. Existing resource hours and time periods were cleared.`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Unable to change Entry Type. Existing grid data was preserved.');
    } finally {
      setIsResettingEntryType(false);
    }
  };

  const handleAddResource = () => {
    const defaultLaborCategory = activeLaborCategories[0];
    const rowId = createTemporaryResourceRowId();
    markUnsaved();
    setResourceRows((current: string[]) => [...current, rowId]);
    if (defaultLaborCategory) {
      setSelectedResources((current: Record<string, string>) => ({ ...current, [rowId]: defaultLaborCategory.id }));
    }
    if (activeSolutionAreas[0]) {
      setSelectedSolutionAreas((current: Record<string, string>) => ({ ...current, [rowId]: activeSolutionAreas[0].id }));
    }
    setSelectedLocations((current: Record<string, string>) => ({ ...current, [rowId]: locationOptions[0] }));
  };

  const handleDeleteResource = (rowId: string) => {
    markUnsaved();
    if (!isTemporaryResourceRowId(rowId)) {
      setDeletedStaffingPlanResourceIds((current: string[]) => current.includes(rowId) ? current : [...current, rowId]);
    }
    setResourceRows((current: string[]) => current.filter((resourceRow: string) => resourceRow !== rowId));
    setSelectedResources((current: Record<string, string>) => {
      const nextResources = { ...current };
      delete nextResources[rowId];
      return nextResources;
    });
    setSelectedSolutionAreas((current: Record<string, string>) => {
      const nextSolutionAreas = { ...current };
      delete nextSolutionAreas[rowId];
      return nextSolutionAreas;
    });
    setResourceNames((current: Record<string, string>) => {
      const nextResourceNames = { ...current };
      delete nextResourceNames[rowId];
      return nextResourceNames;
    });
    setSelectedLocations((current: Record<string, string>) => {
      const nextLocations = { ...current };
      delete nextLocations[rowId];
      return nextLocations;
    });
    setSavedSkillsets((current: Record<string, SkillsetRow[]>) => {
      const nextSkillsets = { ...current };
      delete nextSkillsets[rowId];
      return nextSkillsets;
    });
    if (skillsetsRowId === rowId) {
      setSkillsetsRowId(undefined);
      setDraftSkillsets(createEmptySkillsets());
    }
    setGridValues((current: Record<string, string>) => {
      const nextGridValues = { ...current };
      activePeriods.forEach((period: GridPeriod) => {
        delete nextGridValues[`${rowId}-${period.id}`];
      });
      return nextGridValues;
    });
  };

  const getSkillsetAreaValue = (skillset: SolutionAreaSkillsets): string => skillset.skillsetArea;

  const getSkillsetSolutionAreaName = (skillset: SolutionAreaSkillsets): string => {
    if (typeof skillset.solutionArea === 'string') {
      return skillset.solutionArea;
    }

    return skillset.solutionArea.solutionArea;
  };

  const getSolutionAreaSkillsetOptions = (solutionAreaName: string): SolutionAreaSkillsets[] => {
    return activeSolutionAreaSkillsets.filter((skillset: SolutionAreaSkillsets) => getSkillsetSolutionAreaName(skillset) === solutionAreaName);
  };

  const getLevel1SkillsetOptions = (skillsetAreaName: string, solutionAreaName: string): Level1SkillsetNames[] => {
    const matchingParent = activeSolutionAreaSkillsets.find((skillset: SolutionAreaSkillsets) => getSkillsetAreaValue(skillset) === skillsetAreaName && getSkillsetSolutionAreaName(skillset) === solutionAreaName);

    if (!matchingParent) {
      return [];
    }

    return activeLevel1SkillsetNames.filter((level1Skillset: Level1SkillsetNames) => level1Skillset.solutionAreaSkillsets?.id === matchingParent.id);
  };

  const getLevel2SkillsetOptions = (level1SkillsetId: string): Level2SkillsetNames[] => {
    if (!level1SkillsetId) {
      return [];
    }

    return activeLevel2SkillsetNames.filter((level2Skillset: Level2SkillsetNames) => level2Skillset.level1SkillsetNames?.id === level1SkillsetId);
  };

  const handleOpenSkillsets = (rowId: string) => {
    const rowSolutionAreaId = selectedSolutionAreas[rowId] ?? '';
    const rowSolutionAreaName = activeSolutionAreas.find((solutionArea: SolutionArea) => solutionArea.id === rowSolutionAreaId)?.solutionArea ?? '';
    const validSkillsetAreaNames = new Set(getSolutionAreaSkillsetOptions(rowSolutionAreaName).map((skillset: SolutionAreaSkillsets) => getSkillsetAreaValue(skillset)));
    const rowSkillsets = savedSkillsets[rowId] ?? createEmptySkillsets();
    setDraftSkillsets(rowSkillsets.map((skillset: SkillsetRow) => ({
      ...skillset,
      functionalProductTechnical: validSkillsetAreaNames.has(skillset.functionalProductTechnical) ? skillset.functionalProductTechnical : '',
    })));
    setSkillsetsRowId(rowId);
  };

  const handleSkillsetValueChange = (identifier: SkillsetIdentifier, field: keyof Omit<SkillsetRow, 'identifier'>, value: string) => {
    setDraftSkillsets((current: SkillsetRow[]) => current.map((skillset: SkillsetRow) => {
      if (skillset.identifier !== identifier) {
        return skillset;
      }

      if (field === 'functionalProductTechnical') {
        return { ...skillset, functionalProductTechnical: value, level1SkillsetName: '', level2SkillsetName: '' };
      }

      if (field === 'level1SkillsetName') {
        return { ...skillset, level1SkillsetName: value, level2SkillsetName: '' };
      }

      return { ...skillset, [field]: value };
    }));
  };

  const handleClearSkillsetRow = (identifier: SkillsetIdentifier) => {
    setDraftSkillsets((current: SkillsetRow[]) => current.map((skillset: SkillsetRow) => {
      if (skillset.identifier !== identifier) {
        return skillset;
      }

      return {
        ...skillset,
        functionalProductTechnical: '',
        level1SkillsetName: '',
        level2SkillsetName: '',
      };
    }));
  };

  const handleCancelSkillsets = () => {
    setDraftSkillsets(createEmptySkillsets());
    setSkillsetsRowId(undefined);
  };

  const handleSaveSkillsets = async () => {
    if (skillsetsRowId === undefined) {
      return;
    }

    const primarySkillset = draftSkillsets.find((skillset: SkillsetRow) => skillset.identifier === 'Primary');
    if (!primarySkillset?.functionalProductTechnical || !primarySkillset.level1SkillsetName) {
      toast.error('Select a Skillset Type and Level 1 Skillset for the Primary skillset before saving.');
      return;
    }

    if (isTemporaryResourceRowId(skillsetsRowId)) {
      toast.error('Save Opportunity before saving skillsets for a new resource row.');
      return;
    }

    const staffingPlanResource = (staffingPlanResources ?? []).find((resource: StaffingPlanResources) => resource.id === skillsetsRowId);
    if (!staffingPlanResource) {
      toast.error('Unable to find the saved staffing plan resource row.');
      return;
    }

    const selectedSolutionArea = activeSolutionAreas.find((solutionArea: SolutionArea) => solutionArea.id === selectedSolutionAreas[skillsetsRowId]);
    const existingSkillsets = (resourceSkillsets ?? []).filter((skillset: ResourceSkillsets) => getResourceSkillsetStaffingResourceId(skillset) === staffingPlanResource.id);
    const draftSkillsetIds = new Set(draftSkillsets.filter((skillset: SkillsetRow) => !isTemporaryResourceRowId(skillset.id)).map((skillset: SkillsetRow) => skillset.id));

    await Promise.all(existingSkillsets.filter((skillset: ResourceSkillsets) => !draftSkillsetIds.has(skillset.id)).map((skillset: ResourceSkillsets) => deleteResourceSkillset.mutateAsync(skillset.id)));

    const savedRows = await Promise.all(draftSkillsets.map(async (skillset: SkillsetRow) => {
      const hasValues = Boolean(skillset.functionalProductTechnical || skillset.level1SkillsetName || skillset.level2SkillsetName);
      if (!hasValues) {
        if (!isTemporaryResourceRowId(skillset.id)) {
          await deleteResourceSkillset.mutateAsync(skillset.id);
        }
        return { ...skillset, id: createTemporaryResourceRowId() };
      }

      const selectedSolutionAreaSkillset = activeSolutionAreaSkillsets.find((option: SolutionAreaSkillsets) => getSkillsetAreaValue(option) === skillset.functionalProductTechnical);
      const selectedLevel1Skillset = activeLevel1SkillsetNames.find((option: Level1SkillsetNames) => option.id === skillset.level1SkillsetName);
      const selectedLevel2Skillset = activeLevel2SkillsetNames.find((option: Level2SkillsetNames) => option.id === skillset.level2SkillsetName);
      const skillsetRecord = {
        skillsetIdentifier: skillset.identifier,
        skillsetType: skillset.functionalProductTechnical || undefined,
        level1SkillsetName: selectedLevel1Skillset ? { id: selectedLevel1Skillset.id, level1SkillsetSolutionAreaSkillsetsKey: selectedLevel1Skillset.level1SkillsetSolutionAreaSkillsetsKey } : undefined,
        level2SkillsetName: selectedLevel2Skillset ? { id: selectedLevel2Skillset.id, level2SkillsetName: selectedLevel2Skillset.level2SkillsetName } : undefined,
        solutionArea: selectedSolutionArea ? { id: selectedSolutionArea.id, solutionArea: selectedSolutionArea.solutionArea } : undefined,
        solutionAreaSkillset: selectedSolutionAreaSkillset ? { id: selectedSolutionAreaSkillset.id, skillsetAreaSolutionAreaKey: selectedSolutionAreaSkillset.skillsetAreaSolutionAreaKey } : undefined,
        staffingPlanResource: { id: staffingPlanResource.id, resourceNotes: staffingPlanResource.resourceNotes },
        staffingPlanResources: { id: staffingPlanResource.id, resourceNotes: staffingPlanResource.resourceNotes },
      };
      const savedSkillset = isTemporaryResourceRowId(skillset.id)
        ? await createResourceSkillset.mutateAsync(skillsetRecord)
        : await updateResourceSkillset.mutateAsync({ id: skillset.id, changedFields: skillsetRecord });

      return { ...skillset, id: savedSkillset.id };
    }));

    markUnsaved();
    setSavedSkillsets((current: Record<string, SkillsetRow[]>) => ({
      ...current,
      [skillsetsRowId]: savedRows,
    }));
    setDraftSkillsets(savedRows);
    toast.success('Resource skillsets saved to the Resource Skillsets table.');
    setSkillsetsRowId(undefined);
  };

  const selectedSkillsetsLaborCategory = skillsetsRowId === undefined ? undefined : activeLaborCategories.find((laborCategory: LaborCategory) => laborCategory.id === selectedResources[skillsetsRowId]);
  const selectedSkillsetsResourceName = skillsetsRowId === undefined ? '' : resourceNames[skillsetsRowId] ?? '';
  const selectedSkillsetsSolutionAreaId = skillsetsRowId === undefined ? '' : selectedSolutionAreas[skillsetsRowId] ?? '';
  const selectedSkillsetsSolutionAreaName = activeSolutionAreas.find((solutionArea: SolutionArea) => solutionArea.id === selectedSkillsetsSolutionAreaId)?.solutionArea ?? 'No solution area selected';
  const skillsetAreaOptions = getSolutionAreaSkillsetOptions(selectedSkillsetsSolutionAreaName === 'No solution area selected' ? '' : selectedSkillsetsSolutionAreaName);

  const handleSave = (successContext: 'opportunity' | 'staffing-plan') => {
    void saveStaffingPlan().catch((error: unknown) => {
      const fallbackMessage = successContext === 'opportunity' ? 'Unable to save opportunity.' : 'Unable to save staffing plan.';
      toast.error(error instanceof Error ? error.message : fallbackMessage);
    });
  };

  return (
    <div className="space-y-3 p-4">

      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">Staffing Plan</h1>
          <p className="text-sm text-muted-foreground">Set opportunity details, resource rows, and actual hours across generated weekly or monthly columns.</p>
        </div>
        <Card className="w-full gap-1 py-0 lg:max-w-4xl">
          <CardHeader className="px-3 pt-1.5 pb-0">
      {isSavingNavigation && (
        <div className="sticky top-0 z-40 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground shadow-sm">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving staffing plan before navigation...
          </span>
        </div>
      )}
            <CardTitle className="text-sm">Opportunity Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-x-3 gap-y-1.5 px-3 pt-0 pb-2.5 sm:grid-cols-2 lg:grid-cols-3">
            <FieldInput label="Opportunity ID:" placeholder="Enter Opportunity ID" value={opportunityId} onValueChange={handleOpportunityIdChange} />
            <FieldInput label="Opportunity Name:" placeholder="Enter opportunity name" value={opportunityName} onValueChange={handleOpportunityNameChange} />
            <DateField label="Project Start Date" date={projectStartDate} error={projectDateValidationMessage} onDateChange={(date: Date | undefined) => { markUnsaved(); setProjectStartDate(date); }} />
            <OpportunityOwnerPicker value={opportunityOwner} onValueChange={setOpportunityOwner} />
            <DateField label="Project End Date" date={projectEndDate} error={projectDateValidationMessage} onDateChange={(date: Date | undefined) => { markUnsaved(); setProjectEndDate(date); }} />
            <SelectField label="Main Clearance Level:" value={clearanceLevel} onValueChange={handleClearanceLevelChange} options={clearanceLevelOptions} />
            <FieldInput label="Delivery Location:" placeholder="Enter delivery location" />
            <FieldInput label="Pursuit Lead:" placeholder="Enter pursuit lead name" value={pursuitLead} onValueChange={handlePursuitLeadChange} />
            <FieldInput label="Architect(s)" placeholder="Enter architect names separated by commas" value={architects} onValueChange={handleArchitectsChange} />
            <CurrencyInput label="Price to Win" placeholder="$0" value={priceToWin} formatter={wholeDollarCurrency} onValueChange={handlePriceToWinChange} />
          </CardContent>
        </Card>
        <Card className="w-full gap-1 py-0 lg:max-w-4xl">
          <CardHeader className="px-3 pt-1.5 pb-0">
            <CardTitle className="text-sm">Scoping Input</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-x-3 gap-y-1.5 px-3 pt-0 pb-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_auto] lg:items-end">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-xs font-medium text-foreground">Entry Type</span>
              <div className="inline-flex rounded-md border border-border bg-card p-0.5 text-card-foreground" role="group" aria-label="Entry Type">
                {(['Monthly', 'Weekly'] as EntryMode[]).map((entryMode: EntryMode) => (
                  <Button
                    key={entryMode}
                    type="button"
                    size="sm"
                    variant={mode === entryMode ? 'default' : 'ghost'}
                    className="h-7 px-3 text-xs"
                    disabled={isResettingEntryType}
                    onClick={() => handleModeChange(entryMode)}
                  >
                    {entryMode} Entry
                  </Button>
                ))}
              </div>
            </div>
            <label className="flex min-w-0 flex-col gap-0.5">
              <span className="text-xs font-medium text-foreground">Duration</span>
              <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-1.5 py-1 text-card-foreground">
                <Input
                  aria-label={`Duration in ${mode.toLowerCase()}`}
                  min={bounds.min}
                  max={bounds.max}
                  type="number"
                  value={duration}
                  onChange={handleDurationChange}
                  className="h-8 w-16 text-right text-xs"
                />
                <span className="text-xs text-muted-foreground">{mode === 'Weekly' ? 'weeks (1-52)' : 'months (13-24)'}</span>
              </div>
            </label>
            <Button size="sm" className="sm:justify-self-start lg:mb-0.5" onClick={handleAddResource}>+ Add Resource</Button>

          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="px-4 pt-3 pb-1">
          <CardTitle className="text-base">{mode} staffing plan · {resourceRows.length} resources · {duration} {mode === 'Weekly' ? 'weeks' : 'months'}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="overflow-auto rounded-md border border-border">
            <table className="w-full min-w-[1200px] border-collapse text-xs">

              <thead className="bg-grid-header text-grid-header-foreground">
                <tr>
                  <th className="sticky left-0 z-30 w-[58px] min-w-[58px] bg-grid-header px-1 py-1.5 text-left font-medium text-grid-header-foreground">Actions</th>
                  <th className="hidden">Grid row ID</th>
                  <th className="sticky left-[58px] z-30 w-[128px] min-w-[128px] bg-grid-header px-1.5 py-1.5 text-left font-medium text-grid-header-foreground">Solution area</th>
                  <th className="sticky left-[186px] z-30 w-[170px] min-w-[170px] bg-grid-header px-1.5 py-1.5 text-left font-medium text-grid-header-foreground">Resource</th>
                  <th className="sticky left-[356px] z-30 w-[132px] min-w-[132px] bg-grid-header px-1.5 py-1.5 text-left font-medium text-grid-header-foreground">Resource Notes</th>
                  <th className="w-[104px] min-w-[104px] px-1.5 py-1.5 text-left font-medium">Location</th>
                  <th className="px-2 py-1.5 text-right font-medium">Total Effort</th>
                  <th className="px-2 py-1.5 text-right font-medium">% Allocation</th>
                  <th className="px-2 py-1.5 text-right font-medium">SM %</th>
                  <th className="px-2 py-1.5 text-right font-medium">Total Revenue</th>
                  {activePeriods.map((period: GridPeriod) => <th key={period.id} className="w-[64px] min-w-[64px] px-1 py-1.5 text-right font-medium">{period.timePeriodName}</th>)}
                  <th className="px-2 py-1.5 text-right font-medium">Total</th>
                </tr>
              </thead>

              <tbody>

                {resourceRows.length === 0 ? (
                  <tr>
                    <td colSpan={activePeriods.length + 11} className="px-4 py-4 text-center text-muted-foreground">No resources added. Select + Add Resource to begin.</td>
                  </tr>
                ) : (
                  <>
                    {resourceRows.map((rowId: string, rowIndex: number) => {
                      const rowTotal = rowTotals[rowId] ?? 0;
                      const laborCategoryRates = laborCategoryRateById[selectedResources[rowId] ?? ''];
                      const totalRevenue = rowTotal * (laborCategoryRates?.billRate ?? 0);
                      const smPercentage = totalRevenue > 0 ? ((totalRevenue - (rowTotal * (laborCategoryRates?.costRate ?? 0))) / totalRevenue) * 100 : undefined;
                      const allocation = overallResourceHours > 0 ? (rowTotal / overallResourceHours) * 100 : 0;
                      return (
                        <tr key={rowId} className={`border-t border-border text-grid-row-foreground ${rowIndex % 2 === 0 ? 'bg-grid-row-odd' : 'bg-grid-row-even'}`}>
                          <td className="sticky left-0 z-20 w-[58px] min-w-[58px] bg-inherit px-0.5 py-1.5 text-grid-row-foreground">
                            <div className="flex items-center gap-0">
                              <Button variant="ghost" size="icon-sm" className="rounded-md border border-border bg-grid-action text-grid-action-foreground hover:bg-grid-action hover:text-grid-action-foreground" onClick={() => handleOpenSkillsets(rowId)} aria-label="Open resource skillsets">
                                <Wrench className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" className="rounded-md border border-border bg-grid-action text-grid-action-foreground hover:bg-grid-action hover:text-grid-action-foreground" onClick={() => handleDeleteResource(rowId)} aria-label="Delete resource row">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                          <td className="hidden" data-grid-row-id={rowId}>{rowId}</td>
                          <td className="sticky left-[58px] z-20 w-[128px] min-w-[128px] bg-inherit px-1.5 py-1.5">
                            <Select value={selectedSolutionAreas[rowId] ?? activeSolutionAreas[0]?.id ?? 'unassigned'} onValueChange={(value: string) => handleSolutionAreaChange(rowId, value)} disabled={activeSolutionAreas.length === 0}>
                              <SelectTrigger className="h-8 w-[116px] text-xs"><SelectValue placeholder="Solution" /></SelectTrigger>
                              <SelectContent>
                                {activeSolutionAreas.map((solutionArea: SolutionArea) => (
                                  <SelectItem key={solutionArea.id} value={solutionArea.id}>{solutionArea.solutionArea}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="sticky left-[186px] z-20 w-[170px] min-w-[170px] bg-inherit px-1.5 py-1.5">
                            <Select value={selectedResources[rowId] ?? activeLaborCategories[0]?.id ?? 'unassigned'} onValueChange={(value: string) => handleSelectedResourceChange(rowId, value)} disabled={activeLaborCategories.length === 0}>
                              <SelectTrigger className="h-8 w-[158px] text-xs"><SelectValue placeholder="Resource" /></SelectTrigger>
                              <SelectContent>
                                {activeLaborCategories.map((laborCategory: LaborCategory) => (
                                  <SelectItem key={laborCategory.id} value={laborCategory.id}>{laborCategory.laborCategoryName}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="sticky left-[356px] z-20 w-[132px] min-w-[132px] bg-inherit px-1.5 py-1.5">
                            <Input
                              aria-label="Resource name"
                              value={resourceNames[rowId] ?? ''}
                              onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleResourceNameChange(rowId, event.currentTarget.value)}
                              placeholder="Name"
                              className="h-8 w-[120px] text-xs"
                            />
      <AlertDialog open={pendingMode !== undefined} onOpenChange={(open: boolean) => { if (!open && !isResettingEntryType) setPendingMode(undefined); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Entry Type?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing to {pendingMode} Entry will permanently delete all saved Resource Hours and Staffing Plan Time Periods for this opportunity. Unsaved grid edits will also be discarded. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResettingEntryType}>Keep current entry type</AlertDialogCancel>
            <AlertDialogAction onClick={(event: React.MouseEvent<HTMLButtonElement>) => { event.preventDefault(); void handleConfirmModeChange(); }} disabled={isResettingEntryType}>
              {isResettingEntryType ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete records and change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

                          </td>
                          <td className="w-[104px] min-w-[104px] px-1.5 py-1.5">
                            <Select value={selectedLocations[rowId] ?? locationOptions[0]} onValueChange={(value: string) => handleLocationChange(rowId, value)}>
                              <SelectTrigger className="h-8 w-[96px] text-xs"><SelectValue placeholder="Location" /></SelectTrigger>
                              <SelectContent>

                                {locationOptions.filter((option: string) => option.length > 0).map((option: string) => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-2 py-1.5 text-right font-semibold">{number.format(rowTotal)}</td>
                          <td className="px-2 py-1.5 text-right font-semibold">{allocation.toFixed(1)}%</td>
                          <td className="px-2 py-1.5 text-right font-semibold">{smPercentage === undefined ? '' : `${smPercentage.toFixed(1)}%`}</td>
                          <td className="px-2 py-1.5 text-right font-semibold">{currency.format(totalRevenue)}</td>
                          {activePeriods.map((period: GridPeriod) => {
                            const cellKey = `${rowId}-${period.id}`;
                            const value = gridValues[cellKey] ?? '';
                            return (
                              <td key={period.id} className="w-[64px] min-w-[64px] px-1 py-1.5 text-right">
                                <Input
                                  aria-label={`${activeLaborCategories.find((laborCategory: LaborCategory) => laborCategory.id === selectedResources[rowId])?.laborCategoryName ?? 'Resource'} ${period.timePeriodName}`}
                                  value={value}
                                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleGridValueChange(cellKey, event.currentTarget.value)}
                                  className="ml-auto h-8 w-14 text-right text-xs"
                                />
                              </td>
                            );
                          })}
                          <td className="px-2 py-1.5 text-right font-semibold">{number.format(rowTotal)}</td>
                        </tr>
                      );
                    })}
                    <tr className="border-t border-grid-header-foreground bg-grid-header text-grid-header-foreground">
                      <td className="sticky left-0 z-20 w-[58px] min-w-[58px] bg-grid-header px-0.5 py-1.5" />
                      <td className="hidden" />
                      <td className="sticky left-[58px] z-20 w-[128px] min-w-[128px] bg-grid-header px-1.5 py-1.5" />
                      <td className="sticky left-[186px] z-20 w-[170px] min-w-[170px] bg-grid-header px-1.5 py-1.5 font-semibold">Totals</td>
                      <td className="sticky left-[356px] z-20 w-[132px] min-w-[132px] bg-grid-header px-1.5 py-1.5" />
                      <td className="w-[104px] min-w-[104px] px-1.5 py-1.5" />
                      <td className="px-2 py-1.5 text-right font-semibold">{number.format(overallResourceHours)}</td>
                      <td className="px-2 py-1.5 text-right font-semibold">{gridTotalAllocation.toFixed(1)}%</td>
                      <td className="px-2 py-1.5" />
                      <td className="px-2 py-1.5 text-right font-semibold">{currency.format(gridTotalRevenue)}</td>
                      {activePeriods.map((period: GridPeriod) => {
                        const periodTotal = periodTotals[period.id];
                        return (
                          <td key={`total-${period.id}`} className="w-[64px] min-w-[64px] px-1 py-1.5 text-right font-semibold">
                            {periodTotal?.hasValue ? number.format(periodTotal.total) : ''}
                          </td>
                        );
                      })}
                      <td className="px-2 py-1.5 text-right font-semibold">{number.format(overallResourceHours)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

        </CardContent>
      </Card>

      <Dialog open={skillsetsRowId !== undefined} onOpenChange={(open: boolean) => { if (!open) handleCancelSkillsets(); }}>
      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => handleSave('opportunity')} disabled={Boolean(projectDateValidationMessage) || !pursuitLead.trim()}><Save className="h-4 w-4" />Save Opportunity</Button>
        <Button size="sm" onClick={() => handleSave('staffing-plan')} disabled={Boolean(projectDateValidationMessage) || !pursuitLead.trim()}><Save className="h-4 w-4" />Save Staffing Plan</Button>
      </div>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base">Resource skillsets</DialogTitle>
            <DialogDescription className="text-xs">
              Enter row-specific skillsets. Saved values persist for this row unless the solution area changes.
            </DialogDescription>
              <div>
                <div className="text-xs font-medium">Solution area</div>
                <div className="text-xs text-muted-foreground">{selectedSkillsetsSolutionAreaName}</div>
              </div>
          </DialogHeader>
          <div className="space-y-3 rounded-md border border-border bg-card p-3 text-card-foreground">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <div className="text-xs font-medium">Labor category</div>
                <div className="text-xs text-muted-foreground">{selectedSkillsetsLaborCategory?.laborCategoryName ?? 'No labor category selected'}</div>
              </div>
              <div>
                <div className="text-xs font-medium">Resource name</div>
                <div className="text-xs text-muted-foreground">{selectedSkillsetsResourceName || 'No resource name entered'}</div>
              </div>
            </div>
            <div className="overflow-auto rounded-md border border-border">
              <table className="w-full min-w-[900px] border-collapse text-xs">
                <thead className="bg-grid-header text-grid-header-foreground">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium">Skilllset Identifier</th>
                    <th className="px-2 py-1.5 text-left font-medium">Skillset Type</th>
                    <th className="px-2 py-1.5 text-left font-medium">Level 1 Skillset Name</th>
                    <th className="px-2 py-1.5 text-left font-medium">Level 2 Skillset Name</th>
                    <th className="w-16 px-2 py-1.5 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {draftSkillsets.map((skillset: SkillsetRow, rowIndex: number) => (
                    <tr
                      key={skillset.identifier}
                      className={`border-t border-border text-grid-row-foreground ${rowIndex % 2 === 0 ? 'bg-grid-row-odd' : 'bg-grid-row-even'}`}
                    >
                      <td className="px-2 py-1.5 font-medium text-grid-row-foreground">{skillset.identifier}</td>
                      <td className="px-2 py-1.5">
                        <Select
                          value={skillset.functionalProductTechnical || undefined}
                          onValueChange={(value: string) => handleSkillsetValueChange(skillset.identifier, 'functionalProductTechnical', value)}
                          disabled={!selectedSkillsetsSolutionAreaId || skillsetAreaOptions.length === 0}
                        >
                          <SelectTrigger className="h-8 w-[260px] text-xs"><SelectValue placeholder="Select skillset area" /></SelectTrigger>
                          <SelectContent>
                            {skillsetAreaOptions.filter((option: SolutionAreaSkillsets) => option.id && getSkillsetAreaValue(option)).map((option: SolutionAreaSkillsets) => {
                              const skillsetArea = getSkillsetAreaValue(option);
                              return <SelectItem key={option.id} value={skillsetArea}>{skillsetArea}</SelectItem>;
                            })}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1.5">
                        <Select
                          value={skillset.level1SkillsetName || undefined}
                          onValueChange={(value: string) => handleSkillsetValueChange(skillset.identifier, 'level1SkillsetName', value)}
                          disabled={!skillset.functionalProductTechnical || getLevel1SkillsetOptions(skillset.functionalProductTechnical, selectedSkillsetsSolutionAreaName).length === 0}
                        >
                          <SelectTrigger className="h-8 w-[260px] text-xs"><SelectValue placeholder="Select level 1 skillset" /></SelectTrigger>
                          <SelectContent>
                            {getLevel1SkillsetOptions(skillset.functionalProductTechnical, selectedSkillsetsSolutionAreaName).filter((option: Level1SkillsetNames) => option.id && option.level1SkillsetName).map((option: Level1SkillsetNames) => (
                              <SelectItem key={option.id} value={option.id}>{option.level1SkillsetName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1.5">
                        <Select
                          value={skillset.level2SkillsetName || undefined}
                          onValueChange={(value: string) => handleSkillsetValueChange(skillset.identifier, 'level2SkillsetName', value)}
                          disabled={!skillset.level1SkillsetName || getLevel2SkillsetOptions(skillset.level1SkillsetName).length === 0}
                        >
                          <SelectTrigger className="h-8 w-[260px] text-xs"><SelectValue placeholder={skillset.level1SkillsetName ? 'Select level 2 skillset' : 'Select level 1 first'} /></SelectTrigger>
                          <SelectContent>
                            {getLevel2SkillsetOptions(skillset.level1SkillsetName).filter((option: Level2SkillsetNames) => option.id && option.level2SkillsetName).map((option: Level2SkillsetNames) => (
                              <SelectItem key={option.id} value={option.id}>{option.level2SkillsetName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-md border border-border bg-grid-action text-grid-action-foreground hover:bg-grid-action hover:text-grid-action-foreground"
                          aria-label={`Clear ${skillset.identifier} skillset selections`}
                          onClick={() => handleClearSkillsetRow(skillset.identifier)}
>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={handleCancelSkillsets}>Cancel</Button>
              <Button size="sm" onClick={() => { void handleSaveSkillsets().catch((error: unknown) => { toast.error(error instanceof Error ? error.message : 'Unable to save resource skillsets.'); }); }}>Save skillsets</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function OpportunityOwnerPicker({ value, onValueChange }: { value: User | undefined; onValueChange: (user: User | undefined) => void }) {
  const [open, setOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { data: people = [], error, isFetching, isError, refetch } = useM365PeopleSearch(searchTerm);
  const ownerEmail = value?.UserPrincipalName ?? value?.Mail ?? '';
  const searchErrorMessage = error instanceof Error ? error.message : 'Office 365 Users search is unavailable. Check the connection and try again.';

  const handleSelect = (user: User) => {
    onValueChange(user);
    setSearchTerm('');
    setOpen(false);
  };

  return (
    <div className="space-y-0.5">
      <span className="text-xs font-medium text-foreground">Opportunity Owner</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="h-8 w-full justify-between px-2 text-xs font-normal">
            <span className="flex min-w-0 items-center gap-2">
              <UserRound className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{value?.DisplayName ?? 'Search Entra users'}</span>
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search by display name..." value={searchTerm} onValueChange={setSearchTerm} />
            <CommandList>
              {searchTerm.trim().length < 2 ? (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">Enter at least 2 characters.</div>
              ) : isFetching ? (
                <div className="flex items-center justify-center gap-2 px-3 py-4 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Searching Entra...</div>
              ) : isError ? (
                <div className="space-y-2 px-3 py-4 text-center">
                  <p role="alert" className="text-xs font-medium text-destructive">{searchErrorMessage}</p>
                  <Button type="button" size="sm" variant="outline" onClick={() => { void refetch(); }}>Try again</Button>
                </div>
              ) : (
                <>
                  <CommandEmpty>No matching users found.</CommandEmpty>
                  <CommandGroup>
                    {people.filter((person: User) => person.Id && person.DisplayName).map((person: User) => {
                      const email = person.UserPrincipalName ?? person.Mail ?? '';
                      return (
                        <CommandItem key={person.Id} value={person.Id} onSelect={() => handleSelect(person)} className="items-start">
                          <Check className={`mt-0.5 h-3.5 w-3.5 ${value?.Id === person.Id ? 'visible' : 'invisible'}`} />
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-medium">{person.DisplayName}</span>
                            <span className="block truncate text-xs text-muted-foreground">{email}</span>
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {isError && searchTerm.trim().length >= 2 && (
        <p role="alert" className="text-xs font-medium text-destructive">{searchErrorMessage}</p>
      )}
      {value && (
        <div className="flex items-center justify-between gap-2 rounded-md bg-muted px-2 py-1 text-muted-foreground">
          <span className="truncate text-xs">{ownerEmail}</span>
          <Button type="button" variant="ghost" size="icon-sm" className="h-5 w-5 shrink-0" onClick={() => onValueChange(undefined)} aria-label="Clear Opportunity Owner">
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}


function DateField({ label, date, error, onDateChange }: { label: string; date: Date | undefined; error?: string; onDateChange: (date: Date | undefined) => void }) {
  return (
    <label className="space-y-0.5">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-8 w-full justify-start text-left text-xs font-normal" aria-invalid={Boolean(error)}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PPP') : <span className="text-muted-foreground">Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={date} onSelect={onDateChange} initialFocus />
        </PopoverContent>
      </Popover>
      {error && <span className="text-xs font-medium text-destructive">{error}</span>}
    </label>
  );
}



function SelectField({ label, value, onValueChange, options }: { label: string; value: string; onValueChange: (value: string) => void; options: readonly string[] }) {
  return (
    <label className="space-y-0.5">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-8 w-full text-xs"><SelectValue placeholder="Select clearance level" /></SelectTrigger>
        <SelectContent>
          {options.filter((option: string) => option.length > 0).map((option: string) => (
            <SelectItem key={option} value={option}>{option}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function CurrencyInput({ label, placeholder, value, formatter, onValueChange }: { label: string; placeholder: string; value: string; formatter: Intl.NumberFormat; onValueChange: (value: string) => void }) {
  const displayValue = value.trim() ? formatter.format(Number.parseInt(value, 10) || 0) : '';

  return (
    <label className="space-y-0.5">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <Input
        className="h-8 text-xs"
        inputMode="numeric"
        placeholder={placeholder}
        value={displayValue}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => onValueChange(event.currentTarget.value)}
      />
    </label>
  );
}

function FieldInput({ label, placeholder, value, onValueChange }: { label: string; placeholder: string; value?: string; onValueChange?: (value: string) => void }) {
  return (
    <label className="space-y-0.5">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <Input className="h-8 text-xs" placeholder={placeholder} value={value} onChange={(event: React.ChangeEvent<HTMLInputElement>) => onValueChange?.(event.currentTarget.value)} />
    </label>
  );
}
