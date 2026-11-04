import type * as t from '@/types';

/** Mirrors LibreChat's `/api/usage` contract (`librechat-data-provider` `types/usage`). */
export const USAGE_RANGES = ['24h', '7d', '30d', '90d'] as const satisfies readonly t.UsageRange[];
export const USAGE_SORTS = [
  'tokens',
  'credits',
  'lastActive',
] as const satisfies readonly t.UsageSort[];
export const USAGE_PAGE_SIZE = 25;
export const USAGE_SEARCH_MIN_LENGTH = 2;
export const USAGE_SEARCH_MAX_LENGTH = 200;
