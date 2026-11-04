import '@/locales/i18n';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderSections } from '@/test/sections';

const SECTIONS = ['balance', 'transactions'];
const YAML = {
  balance: {
    enabled: true,
    startBalance: 1000000,
    autoRefillEnabled: true,
    refillIntervalValue: 4,
    refillIntervalUnit: 'hours',
    refillAmount: 1000000,
  },
};

describe('CreditsRenderer', () => {
  it('renders balance and transactions as one card, entered in dollars with credits shown', () => {
    renderSections({ sections: SECTIONS, yaml: YAML });
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 2, name: /Balance & credits/ })).toBeVisible();
    expect(screen.getByLabelText('Starting balance')).toHaveValue('1.00');
    expect(screen.getByText('= 1,000,000 credits')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount per refill')).toHaveValue('1.00');
    expect(screen.getByText('Each refill is 1,000,000 credits.')).toBeInTheDocument();
    expect(screen.getByLabelText('Refill interval')).toHaveValue(4);
    expect(screen.getByLabelText('Refill interval unit')).toHaveDisplayValue('hours');
  });

  it('stages typed dollars as exact credits and rejects what is not a dollar amount', async () => {
    const onChange = vi.fn();
    renderSections({ sections: SECTIONS, yaml: YAML, onChange });
    const input = screen.getByLabelText('Starting balance');
    fireEvent.change(input, { target: { value: '$2.50' } });
    await act(async () => {
      fireEvent.blur(input);
    });
    expect(onChange).toHaveBeenCalledWith('balance.startBalance', 2500000);
    fireEvent.change(input, { target: { value: '0.29' } });
    await act(async () => {
      fireEvent.blur(input);
    });
    expect(onChange).toHaveBeenCalledWith('balance.startBalance', 290000);
    fireEvent.change(input, { target: { value: '12abc' } });
    await act(async () => {
      fireEvent.blur(input);
    });
    expect(screen.getByRole('alert')).toHaveTextContent('dollar amount');
  });

  it('converts the refill amount from dollars too', async () => {
    const onChange = vi.fn();
    renderSections({ sections: SECTIONS, yaml: YAML, onChange });
    const input = screen.getByLabelText('Amount per refill');
    fireEvent.change(input, { target: { value: '0.25' } });
    await act(async () => {
      fireEvent.blur(input);
    });
    expect(onChange).toHaveBeenCalledWith('balance.refillAmount', 250000);
  });

  it('shows the refill sentence only while auto-refill is on', () => {
    renderSections({
      sections: SECTIONS,
      yaml: { balance: { ...YAML.balance, autoRefillEnabled: false } },
    });
    expect(screen.queryByLabelText('Amount per refill')).not.toBeInTheDocument();
    expect(screen.getByText(/Turn on auto-refill/)).toBeInTheDocument();
  });

  it('lists balance and transactions settings it does not place, so none is hidden', () => {
    renderSections({
      sections: SECTIONS,
      yaml: {
        balance: { ...YAML.balance, refillCap: 5000000 },
        transactions: { enabled: true, retentionDays: 30 },
      },
    });
    expect(screen.getByText('refillCap')).toBeInTheDocument();
    expect(screen.getByText('retentionDays')).toBeInTheDocument();
  });

  it('warns while balance needs transactions that are turned off', () => {
    renderSections({ sections: SECTIONS, yaml: { ...YAML, transactions: { enabled: false } } });
    expect(screen.getByText(/LibreChat keeps recording them/)).toBeInTheDocument();
  });
});
