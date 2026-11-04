import type * as t from '@/types';
import { CREDITS_PER_USD } from '@/constants';
import { lowerSource } from '@/utils';

const usdFormat = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

/** A dollar amount for a credit figure's hint ("$1.00", "$0.02"). */
export function formatUsd(amount: number): string {
  return usdFormat.format(amount);
}

/** One credit is $0.000001, so six places show any credit amount exactly. */
const USD_DECIMALS = 6;
/** Fixed `.` decimal so what is shown always parses back; the field is not locale-aware. */
const usdInputFormat = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: USD_DECIMALS,
});
const USD_PATTERN = new RegExp(`^(\\d+(\\.\\d{0,${USD_DECIMALS}})?|\\.\\d{1,${USD_DECIMALS}})$`);

/** Credits as the dollar text a USD input shows ("1.00", "0.25", "1,234.50"). */
export function creditsToUsdText(credits: number): string {
  return usdInputFormat.format(credits / CREDITS_PER_USD);
}

/**
 * Typed dollars ("1", "$0.50", "1,234.56") as whole credits, or null when the
 * text is not a dollar amount with at most six decimal places. Parsed as
 * digits, not floats, so $0.29 is exactly 290,000 credits.
 */
export function parseUsdToCredits(text: string): number | null {
  const clean = text.replace(/[\s,$_'’]/g, '');
  if (!USD_PATTERN.test(clean)) return null;
  const [whole, fraction = ''] = clean.split('.');
  return Number(whole || '0') * CREDITS_PER_USD + Number(fraction.padEnd(USD_DECIMALS, '0'));
}

/** Layers whose value is a setting someone made (shown as the value), not a default (a placeholder). */
const SETTING_SOURCES: ReadonlySet<t.ProvenanceSource> = new Set([
  'yaml',
  'inherited',
  'admin',
  'scope',
]);

/**
 * What an input shows for a field: its own value, else a value librechat.yaml
 * or Base sets (as the value, like the generic rows), with a default only as
 * the placeholder.
 */
export function inputValues(field: t.OwnedField): {
  value: t.ConfigValue;
  placeholder: t.ConfigValue;
} {
  if (field.own !== undefined) return { value: field.own, placeholder: field.fallback };
  if (SETTING_SOURCES.has(lowerSource(field.state))) {
    return { value: field.fallback, placeholder: undefined };
  }
  return { value: undefined, placeholder: field.fallback };
}
