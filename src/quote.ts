export const FREE_DELIVERY_SUBTOTAL_CENTS = 5000;
export const RUSH_SURCHARGE_CENTS = 300;
export const EVENING_DELIVERY_WINDOW_SURCHARGE_CENTS = 200;
export const WEEKEND_DELIVERY_WINDOW_SURCHARGE_CENTS = 400;
export const WEIGHT_SURCHARGE_LOW_THRESHOLD_GRAMS = 5000;
export const WEIGHT_SURCHARGE_HIGH_THRESHOLD_GRAMS = 20000;
export const WEIGHT_SURCHARGE_LOW_CENTS = 200;
export const WEIGHT_SURCHARGE_HIGH_CENTS = 500;
export const SMALL_ORDER_SURCHARGE_FLOOR_CENTS = 1500;
export const SMALL_ORDER_SURCHARGE_CENTS = 200;

export type ServiceLevel = 'standard' | 'rush';
export type DeliveryWindow = 'daytime' | 'evening' | 'weekend';
export type QuoteBreakdownLine = {
  code: 'base' | 'rush' | 'weight' | 'small-order' | 'delivery-window';
  amountCents: number;
};
export type QuoteCalculation = { deliveryFeeCents: number; breakdown: QuoteBreakdownLine[] };

export function calculateDeliveryQuote(
  subtotalCents: number,
  distanceKm: number,
  serviceLevel: ServiceLevel = 'standard',
  weightGrams?: number,
  deliveryWindow: DeliveryWindow = 'daytime',
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
  if (subtotalCents < SMALL_ORDER_SURCHARGE_FLOOR_CENTS) {
    breakdown.push({ code: 'small-order', amountCents: SMALL_ORDER_SURCHARGE_CENTS });
  }
  const deliveryWindowSurcharge =
    deliveryWindow === 'evening'
      ? EVENING_DELIVERY_WINDOW_SURCHARGE_CENTS
      : deliveryWindow === 'weekend'
        ? WEEKEND_DELIVERY_WINDOW_SURCHARGE_CENTS
        : 0;

  if (deliveryWindowSurcharge > 0) {
    breakdown.push({ code: 'delivery-window', amountCents: deliveryWindowSurcharge });
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
  deliveryWindow: DeliveryWindow = 'daytime',
): number {
  return calculateDeliveryQuote(
    subtotalCents,
    distanceKm,
    serviceLevel,
    weightGrams,
    deliveryWindow,
  )
    .deliveryFeeCents;
}
