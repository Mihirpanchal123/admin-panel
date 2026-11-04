import { CREDITS_PER_USD } from '@/constants';

export function formatCompact(value: number): string {
  return new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatExact(value: number): string {
  return new Intl.NumberFormat().format(value);
}

export function formatCost(credits: number): string {
  const usd = credits / CREDITS_PER_USD;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: usd > 0 && usd < 0.01 ? 4 : 2,
  }).format(usd);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}
