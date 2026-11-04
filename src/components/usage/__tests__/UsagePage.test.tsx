import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type * as t from '@/types';
import { getUsageFn, getUserUsageFn } from '@/server';
import { UsagePage } from '../UsagePage';

const USER_ID = 'a'.repeat(24);
const TOTALS: t.UsageTotals = {
  promptTokens: 1200,
  completionTokens: 400,
  totalTokens: 1600,
  credits: 2_000_000,
  requests: 9,
};
const PAGE: t.UsagePage = {
  range: '30d',
  from: '2026-10-05T12:00:00.000Z',
  to: '2026-11-04T12:00:00.000Z',
  summary: { ...TOTALS, users: 2 },
  users: [
    {
      ...TOTALS,
      userId: USER_ID,
      name: 'Alice',
      email: 'alice@example.com',
      balance: 750,
      lastActive: '2026-11-04T10:00:00.000Z',
    },
    {
      ...TOTALS,
      userId: 'b'.repeat(24),
      name: '',
      email: 'bob@example.com',
      balance: null,
      lastActive: '2026-11-03T10:00:00.000Z',
    },
  ],
  page: 1,
  pages: 1,
  total: 2,
};

vi.mock('@/hooks', async () => {
  const { useDebouncedFilter } = await vi.importActual<typeof import('@/hooks/useDebouncedFilter')>(
    '@/hooks/useDebouncedFilter',
  );
  return {
    useDebouncedFilter,
    useClearButtonLabel: () => undefined,
    useLocalize: () => (key: string, options?: Record<string, string | number>) =>
      options ? `${key}(${Object.values(options).join(',')})` : key,
  };
});

vi.mock('@/server', async () => {
  const { queryOptions } =
    await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  const getUsageFn = vi.fn();
  const getUserUsageFn = vi.fn();
  return {
    getUsageFn,
    getUserUsageFn,
    usageQueryOptions: (filters: t.UsageFilters) =>
      queryOptions({
        queryKey: ['usage', filters],
        queryFn: () => getUsageFn({ data: filters }),
      }),
    userUsageQueryOptions: (filters: t.UserUsageFilters) =>
      queryOptions({
        queryKey: ['userUsage', filters.userId, filters.range],
        queryFn: () => getUserUsageFn({ data: filters }),
      }),
  };
});

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <UsagePage />
    </QueryClientProvider>,
  );
}

const lastFilters = (): t.UsageFilters | undefined =>
  vi.mocked(getUsageFn).mock.lastCall?.[0]?.data;

beforeEach(() => {
  vi.mocked(getUsageFn).mockReset();
  vi.mocked(getUserUsageFn).mockReset();
});

describe('UsagePage', () => {
  it('shows a loading state until usage arrives', async () => {
    vi.mocked(getUsageFn).mockReturnValue(new Promise(() => undefined));
    renderPage();
    expect(await screen.findByRole('status')).toHaveTextContent('com_ui_loading');
  });

  it('shows an error state when usage fails to load', async () => {
    vi.mocked(getUsageFn).mockRejectedValue(new Error('boom'));
    renderPage();
    expect(await screen.findByText('com_usage_error')).toBeInTheDocument();
  });

  it('shows an empty state for a period without usage', async () => {
    vi.mocked(getUsageFn).mockResolvedValue({ ...PAGE, users: [], total: 0 });
    renderPage();
    expect(await screen.findByText('com_usage_empty')).toBeInTheDocument();
  });

  it('lists each user with tokens, cost, balance and a fallback name', async () => {
    vi.mocked(getUsageFn).mockResolvedValue(PAGE);
    renderPage();

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('750')).toBeInTheDocument();
    expect(screen.getByText('com_usage_balance_none')).toBeInTheDocument();
    expect(screen.getByText('com_usage_unknown_user')).toBeInTheDocument();
    expect(screen.getAllByText('$2.00').length).toBeGreaterThan(0);
    expect(lastFilters()).toEqual({ range: '30d', sort: 'tokens', page: 1 });
  });

  it('re-queries when the sort column changes', async () => {
    vi.mocked(getUsageFn).mockResolvedValue(PAGE);
    renderPage();
    await screen.findByText('Alice');

    fireEvent.click(
      screen.getByRole('button', { name: 'com_usage_sort_by(com_usage_col_credits)' }),
    );

    await waitFor(() => expect(lastFilters()).toMatchObject({ sort: 'credits', page: 1 }));
  });

  it('expands a user into the per-model breakdown', async () => {
    vi.mocked(getUsageFn).mockResolvedValue(PAGE);
    vi.mocked(getUserUsageFn).mockResolvedValue({
      userId: USER_ID,
      range: '30d',
      models: [{ ...TOTALS, model: 'gpt-4o' }],
    });
    renderPage();

    const toggle = await screen.findByRole('button', { name: 'com_usage_show_models(Alice)' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);

    expect(await screen.findByText('gpt-4o')).toBeInTheDocument();
    expect(getUserUsageFn).toHaveBeenCalledWith({ data: { userId: USER_ID, range: '30d' } });
    expect(screen.getByRole('button', { name: 'com_usage_hide_models(Alice)' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });
});
