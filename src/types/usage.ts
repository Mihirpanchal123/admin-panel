export type UsageRange = '24h' | '7d' | '30d' | '90d';
export type UsageSort = 'tokens' | 'credits' | 'lastActive';

/** Absolute token counts; `credits` is balance spent (1,000,000 credits = $1). */
export interface UsageTotals {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  credits: number;
  /** Prompt transactions, one per model call. */
  requests: number;
}

export interface UserUsageRow extends UsageTotals {
  userId: string;
  name: string;
  email: string;
  /** Remaining `tokenCredits`; `null` when the user has no balance record. */
  balance: number | null;
  lastActive: string;
}

export interface UsagePage {
  range: UsageRange;
  from: string;
  to: string;
  summary: UsageTotals & { users: number };
  users: UserUsageRow[];
  page: number;
  pages: number;
  total: number;
}

export interface UserUsageModel extends UsageTotals {
  model: string;
}

export interface UserUsageModels {
  userId: string;
  range: UsageRange;
  models: UserUsageModel[];
}

export interface UsageFilters {
  range: UsageRange;
  sort: UsageSort;
  search?: string;
  page: number;
}

export interface UserUsageFilters {
  userId: string;
  range: UsageRange;
}

export interface UsageStatProps {
  label: string;
  value: string;
  detail?: string;
}

export interface UsageSortHeaderProps {
  sort: UsageSort;
  label: string;
  activeSort: UsageSort;
  onSort: (sort: UsageSort) => void;
}

export interface UsageTableRowProps {
  row: UserUsageRow;
  range: UsageRange;
  expanded: boolean;
  isLast: boolean;
  onToggle: () => void;
}

export interface UsageModelsRowProps {
  id: string;
  userId: string;
  range: UsageRange;
}
