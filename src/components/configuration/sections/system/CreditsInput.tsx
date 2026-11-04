import { useId, useState } from 'react';
import { TextField as CUITextField } from '@clickhouse/click-ui';
import type * as t from '@/types';
import { useDraftValue, useLocalize } from '@/hooks';
import { creditsToUsdText, parseUsdToCredits } from './credits';
import { FieldNotice } from '../../fields/Notice';

const numberFormat = new Intl.NumberFormat();

/** Digits of what was typed, so `1,000,000`, `1 000 000` and `1000000` all read as one million. */
function parseCredits(text: string): number | null {
  const digits = text.replace(/[\s,._'’]/g, '');
  if (!/^\d+$/.test(digits)) return null;
  return Number(digits);
}

/** How each unit shows and reads a credit amount; `value` and `onChange` stay in credits. */
const UNITS: Record<t.CreditsInputUnit, t.CreditsUnitFormat> = {
  credits: {
    toText: (credits) => numberFormat.format(credits),
    parse: parseCredits,
    inputMode: 'numeric',
    suffixKey: 'com_config_ctl_unit_credits',
    invalidKey: 'com_config_credits_invalid',
  },
  usd: {
    toText: creditsToUsdText,
    parse: parseUsdToCredits,
    inputMode: 'decimal',
    suffixKey: 'com_config_ctl_unit_usd',
    invalidKey: 'com_config_credits_invalid_usd',
  },
};

/**
 * A credit amount with thousands separators (FX-11), typed as whole credits or,
 * with `unit="usd"`, as dollars converted at `CREDITS_PER_USD`. Typing commits
 * after a pause, on blur or Enter; clearing removes the own value (back to the
 * placeholder's value).
 */
export function CreditsInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  min = 0,
  unit = 'credits',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: t.CreditsInputProps) {
  const localize = useLocalize();
  const errorId = useId();
  const unitId = useId();
  const format = UNITS[unit];
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { draft, setDraft, commit } = useDraftValue<string>({
    value: value == null ? '' : format.toText(value),
    autoCommit: (next) => next === '' || format.parse(next) != null,
    onCommit: (next) => {
      if (next.trim() === '') {
        setError(null);
        const cleared = onChange(undefined);
        setNotice(cleared === false ? localize('com_config_ctl_clear_unavailable') : null);
        return 'reset';
      }
      const parsed = format.parse(next);
      if (parsed == null) {
        setError(localize(format.invalidKey));
        return false;
      }
      if (parsed < min) {
        setError(
          localize('com_config_ctl_number_min', {
            min: unit === 'usd' ? creditsToUsdText(min) : min,
          }),
        );
        return false;
      }
      setError(null);
      onChange(parsed);
    },
  });
  const describedBy = [ariaDescribedBy, unitId, error ? errorId : undefined]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="cui-field flex w-40 max-w-full flex-col gap-1">
      <CUITextField
        id={id}
        value={draft}
        inputMode={format.inputMode}
        autoComplete="off"
        onChange={(next) => {
          setDraft(next);
          setNotice(null);
          if (error) setError(null);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
        }}
        placeholder={placeholder != null ? format.toText(placeholder) : undefined}
        disabled={disabled}
        endContent={
          <span id={unitId} className="pr-1 text-xs text-(--cui-color-text-muted)">
            {localize(format.suffixKey)}
          </span>
        }
        aria-label={ariaLabel}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
      />
      {error && (
        <span id={errorId} role="alert" className="text-xs text-(--cui-color-text-danger)">
          {error}
        </span>
      )}
      {notice && !error && <FieldNotice>{notice}</FieldNotice>}
    </div>
  );
}
