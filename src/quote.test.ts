import { describe, expect, it } from 'vitest';
import {
  calculateDeliveryQuote,
  deliveryFeeCents,
  SMALL_ORDER_SURCHARGE_CENTS,
  SMALL_ORDER_SURCHARGE_FLOOR_CENTS,
  WEIGHT_SURCHARGE_HIGH_CENTS,
  WEIGHT_SURCHARGE_HIGH_THRESHOLD_GRAMS,
  WEIGHT_SURCHARGE_LOW_CENTS,
  WEIGHT_SURCHARGE_LOW_THRESHOLD_GRAMS,
} from './quote.js';

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

  describe('calculateDeliveryQuote', () => {
    it('returns base-only breakdown for standard service', () => {
      expect(calculateDeliveryQuote(3200, 4)).toEqual({
        deliveryFeeCents: 500,
        breakdown: [{ code: 'base', amountCents: 500 }],
      });
    });

    it('keeps base line at zero for free-delivery subtotal', () => {
      expect(calculateDeliveryQuote(5000, 40)).toEqual({
        deliveryFeeCents: 0,
        breakdown: [{ code: 'base', amountCents: 0 }],
      });
    });

    it('adds rush after base and keeps lines equal to total', () => {
      const quote = calculateDeliveryQuote(5000, 40, 'rush');
      expect(quote).toEqual({
        deliveryFeeCents: 300,
        breakdown: [
          { code: 'base', amountCents: 0 },
          { code: 'rush', amountCents: 300 },
        ],
      });
      expect(quote.breakdown.reduce((sum, line) => sum + line.amountCents, 0)).toBe(
        quote.deliveryFeeCents,
      );
    });

    it.each([
      [
        WEIGHT_SURCHARGE_LOW_THRESHOLD_GRAMS,
        { deliveryFeeCents: 500, breakdown: [{ code: 'base', amountCents: 500 }] },
      ],
      [
        WEIGHT_SURCHARGE_LOW_THRESHOLD_GRAMS + 1,
        {
          deliveryFeeCents: 500 + WEIGHT_SURCHARGE_LOW_CENTS,
          breakdown: [
            { code: 'base', amountCents: 500 },
            { code: 'weight', amountCents: WEIGHT_SURCHARGE_LOW_CENTS },
          ],
        },
      ],
      [
        WEIGHT_SURCHARGE_HIGH_THRESHOLD_GRAMS,
        {
          deliveryFeeCents: 500 + WEIGHT_SURCHARGE_LOW_CENTS,
          breakdown: [
            { code: 'base', amountCents: 500 },
            { code: 'weight', amountCents: WEIGHT_SURCHARGE_LOW_CENTS },
          ],
        },
      ],
      [
        WEIGHT_SURCHARGE_HIGH_THRESHOLD_GRAMS + 1,
        {
          deliveryFeeCents: 500 + WEIGHT_SURCHARGE_HIGH_CENTS,
          breakdown: [
            { code: 'base', amountCents: 500 },
            { code: 'weight', amountCents: WEIGHT_SURCHARGE_HIGH_CENTS },
          ],
        },
      ],
    ])('applies weight surcharge boundary at %s grams', (weightGrams, expected) => {
      expect(calculateDeliveryQuote(3200, 4, 'standard', weightGrams)).toEqual(expected);
    });

    it('adds weight surcharge under free delivery', () => {
      expect(calculateDeliveryQuote(5000, 40, 'standard', 6000)).toEqual({
        deliveryFeeCents: 200,
        breakdown: [
          { code: 'base', amountCents: 0 },
          { code: 'weight', amountCents: 200 },
        ],
      });
    });

    it('adds weight after rush when both surcharges apply', () => {
      expect(calculateDeliveryQuote(3200, 4, 'rush', 6000)).toEqual({
        deliveryFeeCents: 1000,
        breakdown: [
          { code: 'base', amountCents: 500 },
          { code: 'rush', amountCents: 300 },
          { code: 'weight', amountCents: 200 },
        ],
      });
    });

    it.each([
      [
        0,
        {
          deliveryFeeCents: 500 + SMALL_ORDER_SURCHARGE_CENTS,
          breakdown: [
            { code: 'base', amountCents: 500 },
            { code: 'small-order', amountCents: SMALL_ORDER_SURCHARGE_CENTS },
          ],
        },
      ],
      [
        SMALL_ORDER_SURCHARGE_FLOOR_CENTS - 1,
        {
          deliveryFeeCents: 500 + SMALL_ORDER_SURCHARGE_CENTS,
          breakdown: [
            { code: 'base', amountCents: 500 },
            { code: 'small-order', amountCents: SMALL_ORDER_SURCHARGE_CENTS },
          ],
        },
      ],
      [
        SMALL_ORDER_SURCHARGE_FLOOR_CENTS,
        { deliveryFeeCents: 500, breakdown: [{ code: 'base', amountCents: 500 }] },
      ],
    ])('applies small-order surcharge boundary at %s cents subtotal', (subtotalCents, expected) => {
      expect(calculateDeliveryQuote(subtotalCents, 4)).toEqual(expected);
    });

    it('adds small-order after base, rush, and weight when all surcharges apply', () => {
      expect(calculateDeliveryQuote(1499, 4, 'rush', 6000)).toEqual({
        deliveryFeeCents: 500 + 300 + 200 + SMALL_ORDER_SURCHARGE_CENTS,
        breakdown: [
          { code: 'base', amountCents: 500 },
          { code: 'rush', amountCents: 300 },
          { code: 'weight', amountCents: 200 },
          { code: 'small-order', amountCents: SMALL_ORDER_SURCHARGE_CENTS },
        ],
      });
    });
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

    it('omitting weightGrams keeps the fee unchanged', () => {
      expect(deliveryFeeCents(3200, 4, 'rush')).toBe(800);
      expect(deliveryFeeCents(3200, 4, 'rush', undefined)).toBe(800);
    });
  });
});
