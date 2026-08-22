export const FREE_DELIVERY_SUBTOTAL_CENTS = 5000;
export const RUSH_SURCHARGE_CENTS = 300;
export const WEIGHT_SURCHARGE_LOW_THRESHOLD_GRAMS = 5000;
export const WEIGHT_SURCHARGE_HIGH_THRESHOLD_GRAMS = 20000;
export const WEIGHT_SURCHARGE_LOW_CENTS = 200;
export const WEIGHT_SURCHARGE_HIGH_CENTS = 500;

export type ServiceLevel = 'standard' | 'rush';
export type QuoteBreakdownLine = { code: 'base' | 'rush' | 'weight'; amountCents: number };
export type QuoteCalculation = { deliveryFeeCents: number; breakdown: QuoteBreakdownLine[] };

export function calculateDeliveryQuote(
  subtotalCents: number,
  distanceKm: number,
  serviceLevel: ServiceLevel = 'standard',
  weightGrams?: number,
): QuoteCalculation {
  const base =
    subtotalCents >= FREE_DELIVERY_SUBTOTAL_CENTS
      ? 0
      : distanceKm <= 5
        ? 500
        : distanceKm <= 15
          ? 1000
          : 1500;

  const breakdown: QuoteBreakdownLine[] = [{ code: 'base', amountCents: base }];
  if (serviceLevel === 'rush') {
    breakdown.push({ code: 'rush', amountCents: RUSH_SURCHARGE_CENTS });
  }
  if (weightGrams !== undefined) {
    const weightSurcharge =
      weightGrams <= WEIGHT_SURCHARGE_LOW_THRESHOLD_GRAMS
        ? 0
        : weightGrams <= WEIGHT_SURCHARGE_HIGH_THRESHOLD_GRAMS
          ? WEIGHT_SURCHARGE_LOW_CENTS
          : WEIGHT_SURCHARGE_HIGH_CENTS;

    if (weightSurcharge > 0) {
      breakdown.push({ code: 'weight', amountCents: weightSurcharge });
    }
  }

  return {
    deliveryFeeCents: breakdown.reduce((total, line) => total + line.amountCents, 0),
    breakdown,
  };
}

export function deliveryFeeCents(
  subtotalCents: number,
  distanceKm: number,
  serviceLevel: ServiceLevel = 'standard',
  weightGrams?: number,
): number {
  return calculateDeliveryQuote(subtotalCents, distanceKm, serviceLevel, weightGrams)
    .deliveryFeeCents;
}
