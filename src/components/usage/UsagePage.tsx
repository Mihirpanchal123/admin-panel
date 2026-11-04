import { ButtonGroup } from '@clickhouse/click-ui';
import { useCallback, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type * as t from '@/types';
import { EmptyState, LoadingState, Pagination, SearchInput } from '@/components/shared';
import { USAGE_RANGES, USAGE_SEARCH_MIN_LENGTH } from '@/constants';
import { formatCompact, formatCost, formatExact } from './format';
import { useDebouncedFilter, useLocalize } from '@/hooks';
import { UsageTableRow } from './UsageTableRow';
import { usageQueryOptions } from '@/server';
import { cn } from '@/utils';

const COLUMN_COUNT = 7;
const HEADER = 'px-4 py-2.5 font-medium text-(--cui-color-text-muted)';

const RANGE_LABEL_KEYS: Record<t.UsageRange, string> = {
  '24h': 'com_usage_range_24h',
  '7d': 'com_usage_range_7d',
  '30d': 'com_usage_range_30d',
  '90d': 'com_usage_range_90d',
};

function isUsageRange(value: string): value is t.UsageRange {
  return value in RANGE_LABEL_KEYS;
}

function UsageStat({ label, value, detail }: t.UsageStatProps) {
  return (
    <div className="rounded-lg border border-(--cui-color-stroke-default) bg-(--cui-color-background-panel) p-4">
      <dt className="text-xs text-(--cui-color-text-muted)">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold text-(--cui-color-text-default) tabular-nums">
        {value}
      </dd>
      {detail && <dd className="mt-1 text-xs text-(--cui-color-text-muted)">{detail}</dd>}
    </div>
  );
}

function SortHeader({ sort, label, activeSort, onSort }: t.UsageSortHeaderProps) {
  const localize = useLocalize();
  const active = sort === activeSort;
  return (
    <th scope="col" aria-sort={active ? 'descending' : 'none'} className={cn(HEADER, 'text-right')}>
      <button
        type="button"
        aria-label={localize('com_usage_sort_by', { column: label })}
        onClick={() => onSort(sort)}
        className={cn(
          'cursor-pointer border-none bg-transparent p-0 font-medium focus-visible:outline-2 focus-visible:outline-(--cui-color-outline)',
          active ? 'text-(--cui-color-text-default)' : 'text-(--cui-color-text-muted)',
        )}
      >
        {label}
        {active && <span aria-hidden="true"> ↓</span>}
      </button>
    </th>
  );
}

export function UsagePage() {
  const localize = useLocalize();
  const [range, setRange] = useState<t.UsageRange>('30d');
  const [sort, setSort] = useState<t.UsageSort>('tokens');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const resetToFirstPage = useCallback(() => setPage(1), []);
  const searchFilter = useDebouncedFilter('', resetToFirstPage);
  const search = searchFilter.debouncedValue.trim();

  const filters = useMemo<t.UsageFilters>(
    () => ({
      range,
      sort,
      page,
      ...(search.length >= USAGE_SEARCH_MIN_LENGTH ? { search } : {}),
    }),
    [page, range, search, sort],
  );
  const { data, isPending, isError } = useQuery({
    ...usageQueryOptions(filters),
    placeholderData: keepPreviousData,
  });

  const rangeOptions = useMemo(
    () => USAGE_RANGES.map((value) => ({ value, label: localize(RANGE_LABEL_KEYS[value]) })),
    [localize],
  );

  const changeRange = (value: string) => {
    if (!isUsageRange(value)) return;
    setRange(value);
    setPage(1);
    setExpanded(null);
  };

  const changeSort = (next: t.UsageSort) => {
    setSort(next);
    setPage(1);
  };

  const showLoading = isPending && !data;
  const rows = isError ? [] : (data?.users ?? []);

  return (
    <div
      role="region"
      aria-label={localize('com_usage_title')}
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6"
    >
      <p className="text-sm text-(--cui-color-text-muted)">{localize('com_usage_description')}</p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ButtonGroup
          aria-label={localize('com_usage_range_label')}
          options={rangeOptions}
          selected={range}
          onClick={changeRange}
        />
        <SearchInput
          value={searchFilter.value}
          onChange={searchFilter.onChange}
          placeholder={localize('com_usage_search_placeholder')}
          ariaLabel={localize('com_usage_search_placeholder')}
          className="relative min-w-0 flex-1 sm:max-w-sm"
        />
      </div>

      {data && !isError && (
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <UsageStat
            label={localize('com_usage_active_users')}
            value={formatExact(data.summary.users)}
          />
          <UsageStat
            label={localize('com_usage_total_tokens')}
            value={formatCompact(data.summary.totalTokens)}
            detail={localize('com_usage_tokens_split', {
              input: formatCompact(data.summary.promptTokens),
              output: formatCompact(data.summary.completionTokens),
            })}
          />
          <UsageStat
            label={localize('com_usage_credits_spent')}
            value={formatCompact(data.summary.credits)}
            detail={formatCost(data.summary.credits)}
          />
          <UsageStat
            label={localize('com_usage_col_requests')}
            value={formatCompact(data.summary.requests)}
          />
        </dl>
      )}

      <div
        role="region"
        aria-label={localize('com_usage_table_title')}
        className="overflow-x-auto rounded-lg border border-(--cui-color-stroke-default)"
      >
        <table className="w-full min-w-4xl text-left text-sm">
          <caption className="sr-only">{localize('com_usage_table_title')}</caption>
          <thead className="sticky top-0 z-(--z-sticky)">
            <tr className="border-b border-(--cui-color-stroke-default) bg-(--cui-color-background-muted)">
              <th scope="col" className={HEADER}>
                {localize('com_usage_col_user')}
              </th>
              <th scope="col" className={cn(HEADER, 'text-right')}>
                {localize('com_usage_col_input')}
              </th>
              <th scope="col" className={cn(HEADER, 'text-right')}>
                {localize('com_usage_col_output')}
              </th>
              <SortHeader
                sort="tokens"
                label={localize('com_usage_total_tokens')}
                activeSort={sort}
                onSort={changeSort}
              />
              <SortHeader
                sort="credits"
                label={localize('com_usage_col_credits')}
                activeSort={sort}
                onSort={changeSort}
              />
              <th scope="col" className={cn(HEADER, 'text-right')}>
                {localize('com_usage_col_balance')}
              </th>
              <SortHeader
                sort="lastActive"
                label={localize('com_usage_col_last_active')}
                activeSort={sort}
                onSort={changeSort}
              />
            </tr>
          </thead>
          <tbody>
            {showLoading && (
              <tr>
                <td colSpan={COLUMN_COUNT}>
                  <LoadingState />
                </td>
              </tr>
            )}
            {!showLoading && isError && (
              <tr>
                <td colSpan={COLUMN_COUNT}>
                  <EmptyState message={localize('com_usage_error')} />
                </td>
              </tr>
            )}
            {!showLoading && !isError && rows.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT}>
                  <EmptyState
                    message={localize(search ? 'com_usage_no_matches' : 'com_usage_empty')}
                  />
                </td>
              </tr>
            )}
            {rows.map((row, index) => (
              <UsageTableRow
                key={row.userId}
                row={row}
                range={range}
                expanded={expanded === row.userId}
                isLast={index === rows.length - 1}
                onToggle={() => setExpanded(expanded === row.userId ? null : row.userId)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={isError ? 1 : (data?.pages ?? 1)}
        onPageChange={setPage}
      />

      {data && !isError && (
        <p className="pb-4 text-xs text-(--cui-color-text-muted)" aria-live="polite">
          {localize('com_usage_user_count', { count: data.total })}
        </p>
      )}
    </div>
  );
}
