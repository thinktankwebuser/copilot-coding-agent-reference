export const FREE_DELIVERY_SUBTOTAL_CENTS = 5000;
export const RUSH_SURCHARGE_CENTS = 300;

export type ServiceLevel = 'standard' | 'rush';
export type QuoteBreakdownLine = { code: 'base' | 'rush'; amountCents: number };
export type QuoteCalculation = { deliveryFeeCents: number; breakdown: QuoteBreakdownLine[] };

export function calculateDeliveryQuote(
  subtotalCents: number,
  distanceKm: number,
  serviceLevel: ServiceLevel = 'standard',
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

  return {
    deliveryFeeCents: breakdown.reduce((total, line) => total + line.amountCents, 0),
    breakdown,
  };
}

export function deliveryFeeCents(
  subtotalCents: number,
  distanceKm: number,
  serviceLevel: ServiceLevel = 'standard',
): number {
  return calculateDeliveryQuote(subtotalCents, distanceKm, serviceLevel).deliveryFeeCents;
}
