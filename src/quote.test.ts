import { describe, expect, it } from 'vitest';
import { deliveryFeeCents } from './quote.js';

describe('deliveryFeeCents', () => {
  it.each([
    [0, 500],
    [5, 500],
    [5.1, 1000],
    [15, 1000],
    [15.1, 1500],
    [40, 1500],
  ])('distance %s km -> %s cents', (distanceKm, expected) => {
    expect(deliveryFeeCents(3200, distanceKm)).toBe(expected);
  });

  it('is free when subtotal is at least 5000 cents', () => {
    expect(deliveryFeeCents(5000, 40)).toBe(0);
    expect(deliveryFeeCents(4999, 40)).toBe(1500);
  });
});
