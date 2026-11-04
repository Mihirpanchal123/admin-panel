import { useQuery } from '@tanstack/react-query';
import type * as t from '@/types';
import { DecorativeIcon, EmptyState, LoadingState } from '@/components/shared';
import { formatCost, formatDateTime, formatExact } from './format';
import { userUsageQueryOptions } from '@/server';
import { useLocalize } from '@/hooks';
import { cn } from '@/utils';

const COLUMN_COUNT = 7;
const CELL = 'px-4 py-3 text-right tabular-nums';

function UsageModelsRow({ id, userId, range }: t.UsageModelsRowProps) {
  const localize = useLocalize();
  const { data, isPending, isError } = useQuery(userUsageQueryOptions({ userId, range }));

  let content = <LoadingState className="flex items-center gap-2 py-2 text-xs" />;
  if (isError) {
    content = <EmptyState className="py-2 text-xs" message={localize('com_usage_error')} />;
  } else if (!isPending && data.models.length === 0) {
    content = <EmptyState className="py-2 text-xs" message={localize('com_usage_no_models')} />;
  } else if (!isPending) {
    content = (
      <table className="w-full text-left text-xs">
        <caption className="sr-only">{localize('com_usage_models_caption')}</caption>
        <thead>
          <tr className="text-(--cui-color-text-muted)">
            <th scope="col" className="py-1 font-medium">
              {localize('com_usage_col_model')}
            </th>
            <th scope="col" className="py-1 text-right font-medium">
              {localize('com_usage_col_input')}
            </th>
            <th scope="col" className="py-1 text-right font-medium">
              {localize('com_usage_col_output')}
            </th>
            <th scope="col" className="py-1 text-right font-medium">
              {localize('com_usage_col_credits')}
            </th>
            <th scope="col" className="py-1 text-right font-medium">
              {localize('com_usage_col_requests')}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.models.map((model) => (
            <tr key={model.model} className="text-(--cui-color-text-default)">
              <td className="py-1">{model.model || localize('com_usage_unknown_model')}</td>
              <td className="py-1 text-right tabular-nums">{formatExact(model.promptTokens)}</td>
              <td className="py-1 text-right tabular-nums">
                {formatExact(model.completionTokens)}
              </td>
              <td className="py-1 text-right tabular-nums">
                {formatExact(model.credits)}
                <span className="ml-1 text-(--cui-color-text-muted)">
                  ({formatCost(model.credits)})
                </span>
              </td>
              <td className="py-1 text-right tabular-nums">{formatExact(model.requests)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <tr id={id} className="border-b border-(--cui-color-stroke-default)">
      <td colSpan={COLUMN_COUNT} className="bg-(--cui-color-background-muted) px-12 py-2">
        {content}
      </td>
    </tr>
  );
}

/** One user's totals; the name toggles the per-model breakdown below it. */
export function UsageTableRow({ row, range, expanded, isLast, onToggle }: t.UsageTableRowProps) {
  const localize = useLocalize();
  const name = row.name || localize('com_usage_unknown_user');
  const detailId = `usage-models-${row.userId}`;
  return (
    <>
      <tr
        className={cn(
          'bg-(--cui-color-background-panel) hover:bg-(--cui-color-background-hover)',
          (!isLast || expanded) && 'border-b border-(--cui-color-stroke-default)',
        )}
      >
        <td className="px-4 py-3">
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={expanded ? detailId : undefined}
            aria-label={localize(expanded ? 'com_usage_hide_models' : 'com_usage_show_models', {
              name,
            })}
            onClick={onToggle}
            className="flex cursor-pointer items-center gap-2 border-none bg-transparent p-0 text-left focus-visible:outline-2 focus-visible:outline-(--cui-color-outline)"
          >
            <span
              className={cn(
                'inline-flex transition-transform motion-reduce:transition-none',
                expanded && 'rotate-90',
              )}
            >
              <DecorativeIcon name="chevron-right" size="xs" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-(--cui-color-text-default)">{name}</span>
              <span className="truncate text-xs text-(--cui-color-text-muted)">{row.email}</span>
            </span>
          </button>
        </td>
        <td className={CELL}>{formatExact(row.promptTokens)}</td>
        <td className={CELL}>{formatExact(row.completionTokens)}</td>
        <td className={cn(CELL, 'font-medium text-(--cui-color-text-default)')}>
          {formatExact(row.totalTokens)}
        </td>
        <td className={CELL}>
          <div>{formatExact(row.credits)}</div>
          <div className="text-xs text-(--cui-color-text-muted)">{formatCost(row.credits)}</div>
        </td>
        <td className={CELL}>
          {row.balance === null ? (
            <span className="text-(--cui-color-text-muted)">
              {localize('com_usage_balance_none')}
            </span>
          ) : (
            formatExact(row.balance)
          )}
        </td>
        <td className="px-4 py-3 text-right text-xs whitespace-nowrap text-(--cui-color-text-muted)">
          <time dateTime={row.lastActive}>{formatDateTime(row.lastActive)}</time>
        </td>
      </tr>
      {expanded && <UsageModelsRow id={detailId} userId={row.userId} range={range} />}
    </>
  );
}
