import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InMemoryDataBanner } from '@/generated/components/in-memory-data-banner';
import { HAS_IN_MEMORY_TABLES, useLaborCategoryList, useUpdateLaborCategory } from '@/generated/hooks';
import type { LaborCategory } from '@/generated/models/labor-category-model';

const bannerMessage = "This app uses draft tables for testing. Data entered won't be saved. Contact the app owner to enable storage.";

type RateDrafts = Record<string, { laborBillRate: string; laborCostRate: string }>;

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function formatRate(value: number): string {
  return Number.isFinite(value) ? String(value) : '0';
}

export default function LaborCategoriesPage() {
  const { data: laborCategories, isLoading } = useLaborCategoryList({ orderBy: ['laborCategoryName asc'] });
  const updateLaborCategory = useUpdateLaborCategory();
  const [drafts, setDrafts] = useState<RateDrafts>({});

  const activeLaborCategories = (laborCategories ?? []).filter((laborCategory: LaborCategory) => laborCategory.id && laborCategory.laborCategoryName);

  const getDraftValue = (laborCategory: LaborCategory, field: 'laborBillRate' | 'laborCostRate'): string => {
    return drafts[laborCategory.id]?.[field] ?? formatRate(laborCategory[field]);
  };

  const handleRateChange = (id: string, field: 'laborBillRate' | 'laborCostRate', value: string) => {
    setDrafts((current: RateDrafts) => ({
      ...current,
      [id]: {
        laborBillRate: current[id]?.laborBillRate ?? formatRate(activeLaborCategories.find((laborCategory: LaborCategory) => laborCategory.id === id)?.laborBillRate ?? 0),
        laborCostRate: current[id]?.laborCostRate ?? formatRate(activeLaborCategories.find((laborCategory: LaborCategory) => laborCategory.id === id)?.laborCostRate ?? 0),
        [field]: value,
      },
    }));
  };

  const handleSave = (laborCategory: LaborCategory) => {
    const draft = drafts[laborCategory.id];
    if (!draft) {
      return;
    }

    const laborBillRate = Number.parseFloat(draft.laborBillRate);
    const laborCostRate = Number.parseFloat(draft.laborCostRate);

    if (Number.isNaN(laborBillRate) || Number.isNaN(laborCostRate) || laborBillRate < 0 || laborCostRate < 0) {
      toast.error('Enter valid non-negative rates before saving.');
      return;
    }

    updateLaborCategory.mutate(
      {
        id: laborCategory.id,
        changedFields: {
          laborBillRate,
          laborCostRate,
        },
      },
      {
        onSuccess: () => {
          setDrafts((current: RateDrafts) => {
            const nextDrafts = { ...current };
            delete nextDrafts[laborCategory.id];
            return nextDrafts;
          });
          toast.success(`${laborCategory.laborCategoryName} rates updated.`);
        },
        onError: () => {
          toast.error('Unable to update labor category rates.');
        },
      },
    );
  };

  return (
    <div className="space-y-3 p-4">
      <InMemoryDataBanner show={HAS_IN_MEMORY_TABLES} message={bannerMessage} />
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Labor Categories</h1>
        <p className="text-sm text-muted-foreground">Maintain bill and cost rates used by the Staffing Plan revenue and margin calculations.</p>
      </div>
      <Card>
        <CardHeader className="px-4 pt-3 pb-1">
          <CardTitle className="text-base">Rate table</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="overflow-auto rounded-md border border-border">
            <table className="w-full min-w-[620px] border-collapse text-xs">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium">Labor category</th>
                  <th className="px-2 py-1.5 text-right font-medium">Labor bill rate</th>
                  <th className="px-2 py-1.5 text-right font-medium">Labor cost rate</th>
                  <th className="px-2 py-1.5 text-right font-medium">Current spread</th>
                  <th className="w-[90px] px-2 py-1.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-muted-foreground">Loading labor categories...</td>
                  </tr>
                ) : activeLaborCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-muted-foreground">No labor categories available.</td>
                  </tr>
                ) : (
                  activeLaborCategories.map((laborCategory: LaborCategory) => {
                    const hasDraft = Boolean(drafts[laborCategory.id]);
                    const billRate = Number.parseFloat(getDraftValue(laborCategory, 'laborBillRate'));
                    const costRate = Number.parseFloat(getDraftValue(laborCategory, 'laborCostRate'));
                    const spread = (Number.isNaN(billRate) ? 0 : billRate) - (Number.isNaN(costRate) ? 0 : costRate);

                    return (
                      <tr key={laborCategory.id} className="border-t border-border">
                        <td className="px-2 py-1.5 font-medium text-card-foreground">{laborCategory.laborCategoryName}</td>
                        <td className="px-2 py-1.5 text-right">
                          <Input
                            aria-label={`${laborCategory.laborCategoryName} labor bill rate`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={getDraftValue(laborCategory, 'laborBillRate')}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleRateChange(laborCategory.id, 'laborBillRate', event.currentTarget.value)}
                            className="ml-auto h-8 w-28 text-right text-xs"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <Input
                            aria-label={`${laborCategory.laborCategoryName} labor cost rate`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={getDraftValue(laborCategory, 'laborCostRate')}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleRateChange(laborCategory.id, 'laborCostRate', event.currentTarget.value)}
                            className="ml-auto h-8 w-28 text-right text-xs"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right font-semibold">{currency.format(spread)}</td>
                        <td className="px-2 py-1.5 text-right">
                          <Button size="sm" onClick={() => handleSave(laborCategory)} disabled={!hasDraft || updateLaborCategory.isPending}>Save</Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
