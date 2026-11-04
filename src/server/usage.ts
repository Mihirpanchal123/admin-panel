import { z } from 'zod';
import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import type * as t from '@/types';
import {
  USAGE_SORTS,
  USAGE_RANGES,
  USAGE_PAGE_SIZE,
  OBJECT_ID_PATTERN,
  USAGE_SEARCH_MAX_LENGTH,
} from '@/constants';
import { apiFetch, extractApiError } from './utils/api';
import { requireCapability } from './capabilities';
import { SystemCapabilities } from './constants';

const totalsSchema = z.object({
  promptTokens: z.number(),
  completionTokens: z.number(),
  totalTokens: z.number(),
  credits: z.number(),
  requests: z.number(),
});

const usagePageSchema: z.ZodType<t.UsagePage> = z.object({
  range: z.enum(USAGE_RANGES),
  from: z.string(),
  to: z.string(),
  summary: totalsSchema.extend({ users: z.number() }),
  users: z.array(
    totalsSchema.extend({
      userId: z.string(),
      name: z.string(),
      email: z.string(),
      balance: z.number().nullable(),
      lastActive: z.string(),
    }),
  ),
  page: z.number(),
  pages: z.number(),
  total: z.number(),
});

const userUsageModelsSchema: z.ZodType<t.UserUsageModels> = z.object({
  userId: z.string(),
  range: z.enum(USAGE_RANGES),
  models: z.array(totalsSchema.extend({ model: z.string() })),
});

const usageFiltersSchema = z.object({
  range: z.enum(USAGE_RANGES),
  sort: z.enum(USAGE_SORTS),
  search: z.string().max(USAGE_SEARCH_MAX_LENGTH).optional(),
  page: z.number().int().min(1),
});

/** Constrained to an ObjectId so a crafted id cannot reach a sibling `/api/usage` route. */
const userUsageFiltersSchema = z.object({
  userId: z.string().regex(OBJECT_ID_PATTERN),
  range: z.enum(USAGE_RANGES),
});

function toQueryString(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Proxies LibreChat's `/api/usage`, which gates on `read:usage` itself; the
 * proxy checks first so a viewer without it is refused before the round-trip.
 */
export const getUsageFn = createServerFn({ method: 'GET' })
  .validator(usageFiltersSchema)
  .handler(async ({ data }: { data: t.UsageFilters }): Promise<t.UsagePage> => {
    await requireCapability(SystemCapabilities.READ_USAGE);
    const response = await apiFetch(
      `/api/usage${toQueryString({ ...data, pageSize: USAGE_PAGE_SIZE })}`,
    );
    if (!response.ok) {
      await extractApiError(response, 'Failed to load token usage');
    }
    return usagePageSchema.parse(await response.json());
  });

export const getUserUsageFn = createServerFn({ method: 'GET' })
  .validator(userUsageFiltersSchema)
  .handler(async ({ data }: { data: t.UserUsageFilters }): Promise<t.UserUsageModels> => {
    await requireCapability(SystemCapabilities.READ_USAGE);
    const response = await apiFetch(
      `/api/usage/users/${encodeURIComponent(data.userId)}${toQueryString({ range: data.range })}`,
    );
    if (!response.ok) {
      await extractApiError(response, 'Failed to load token usage');
    }
    return userUsageModelsSchema.parse(await response.json());
  });

export const usageQueryOptions = (filters: t.UsageFilters) =>
  queryOptions({
    queryKey: ['usage', filters] as const,
    queryFn: () => getUsageFn({ data: filters }),
    staleTime: 60_000,
  });

export const userUsageQueryOptions = (filters: t.UserUsageFilters) =>
  queryOptions({
    queryKey: ['userUsage', filters.userId, filters.range] as const,
    queryFn: () => getUserUsageFn({ data: filters }),
    staleTime: 60_000,
  });
