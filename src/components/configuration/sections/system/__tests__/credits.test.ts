import { describe, expect, it } from 'vitest';
import { creditsToUsdText, parseUsdToCredits } from '../credits';

describe('parseUsdToCredits', () => {
  it.each([
    ['1', 1_000_000],
    ['1.5', 1_500_000],
    ['$0.50', 500_000],
    ['0.29', 290_000],
    ['1,234.56', 1_234_560_000],
    ['.25', 250_000],
    ['0.000001', 1],
    [' 20 ', 20_000_000],
  ])('reads %s as %d credits', (text, credits) => {
    expect(parseUsdToCredits(text)).toBe(credits);
  });

  it.each(['', 'abc', '1.2.3', '-1', '0.0000001', '1e3'])('rejects %s', (text) => {
    expect(parseUsdToCredits(text)).toBeNull();
  });
});

describe('creditsToUsdText', () => {
  it.each([
    [1_000_000, '1.00'],
    [250_000, '0.25'],
    [1, '0.000001'],
    [1_234_560_000, '1,234.56'],
  ])('shows %d credits as %s', (credits, text) => {
    expect(creditsToUsdText(credits)).toBe(text);
  });

  it('round-trips through the parser', () => {
    for (const credits of [1, 999, 290_000, 1_000_000, 123_456_789]) {
      expect(parseUsdToCredits(creditsToUsdText(credits))).toBe(credits);
    }
  });
});
