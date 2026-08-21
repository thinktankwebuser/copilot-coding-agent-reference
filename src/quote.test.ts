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

  describe('serviceLevel', () => {
    it('standard behaves the same as default', () => {
      expect(deliveryFeeCents(3200, 4, 'standard')).toBe(500);
      expect(deliveryFeeCents(5000, 40, 'standard')).toBe(0);
    });

    it('rush adds 300-cent surcharge', () => {
      expect(deliveryFeeCents(3200, 4, 'rush')).toBe(800);
      expect(deliveryFeeCents(3200, 40, 'rush')).toBe(1800);
    });

    it('rush with free-delivery subtotal still returns 300 cents', () => {
      expect(deliveryFeeCents(5000, 40, 'rush')).toBe(300);
    });
  });
});
