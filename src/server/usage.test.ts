import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetchMock = vi.fn();
const requireCapabilityMock = vi.fn();

vi.mock('./utils/api', () => ({
  apiFetch: (path: string, init?: RequestInit) => apiFetchMock(path, init),
  extractApiError: vi.fn(async (_response: Response, message: string) => {
    throw new Error(message);
  }),
}));

vi.mock('./capabilities', () => ({
  requireCapability: (capability: string) => requireCapabilityMock(capability),
}));

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => ({
    handler: (fn: (...args: never[]) => unknown) => fn,
    validator: () => ({
      handler: (fn: (...args: never[]) => unknown) => fn,
    }),
  }),
}));

import { getUsageFn, getUserUsageFn } from './usage';

const USER_ID = 'a'.repeat(24);
const TOTALS = {
  promptTokens: 100,
  completionTokens: 40,
  totalTokens: 140,
  credits: 900,
  requests: 2,
};
const PAGE = {
  range: '7d',
  from: '2026-10-28T12:00:00.000Z',
  to: '2026-11-04T12:00:00.000Z',
  summary: { ...TOTALS, users: 1 },
  users: [
    {
      ...TOTALS,
      userId: USER_ID,
      name: 'Alice',
      email: 'alice@example.com',
      balance: null,
      lastActive: '2026-11-04T10:00:00.000Z',
    },
  ],
  page: 1,
  pages: 1,
  total: 1,
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  vi.clearAllMocks();
  requireCapabilityMock.mockResolvedValue(undefined);
});

describe('usage server functions', () => {
  it('checks read:usage and forwards the filters to LibreChat', async () => {
    apiFetchMock.mockResolvedValue(json(PAGE));

    await expect(
      getUsageFn({ data: { range: '7d', sort: 'credits', search: 'ali', page: 2 } }),
    ).resolves.toEqual(PAGE);

    expect(requireCapabilityMock).toHaveBeenCalledWith('read:usage');
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/usage?range=7d&sort=credits&search=ali&page=2&pageSize=25',
      undefined,
    );
  });

  it('refuses before calling LibreChat when the viewer lacks read:usage', async () => {
    requireCapabilityMock.mockRejectedValue(new Error('Insufficient permissions'));

    await expect(getUsageFn({ data: { range: '7d', sort: 'tokens', page: 1 } })).rejects.toThrow(
      'Insufficient permissions',
    );
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('surfaces a failed LibreChat response as an error', async () => {
    apiFetchMock.mockResolvedValue(json({ message: 'Forbidden' }, 403));

    await expect(getUsageFn({ data: { range: '7d', sort: 'tokens', page: 1 } })).rejects.toThrow(
      'Failed to load token usage',
    );
  });

  it('rejects a response that does not match the usage contract', async () => {
    apiFetchMock.mockResolvedValue(json({ ...PAGE, users: [{ userId: USER_ID }] }));

    await expect(getUsageFn({ data: { range: '7d', sort: 'tokens', page: 1 } })).rejects.toThrow();
  });

  it('loads one user by model with an encoded id', async () => {
    const models = { userId: USER_ID, range: '30d', models: [{ ...TOTALS, model: 'gpt-4o' }] };
    apiFetchMock.mockResolvedValue(json(models));

    await expect(getUserUsageFn({ data: { userId: USER_ID, range: '30d' } })).resolves.toEqual(
      models,
    );
    expect(apiFetchMock).toHaveBeenCalledWith(`/api/usage/users/${USER_ID}?range=30d`, undefined);
  });
});
