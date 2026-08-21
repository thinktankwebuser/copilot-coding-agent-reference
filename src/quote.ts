export const FREE_DELIVERY_SUBTOTAL_CENTS = 5000;
export const RUSH_SURCHARGE_CENTS = 300;

export type ServiceLevel = 'standard' | 'rush';

export function deliveryFeeCents(
  subtotalCents: number,
  distanceKm: number,
  serviceLevel: ServiceLevel = 'standard',
): number {
  const base =
    subtotalCents >= FREE_DELIVERY_SUBTOTAL_CENTS
      ? 0
      : distanceKm <= 5
        ? 500
        : distanceKm <= 15
          ? 1000
          : 1500;
  const surcharge = serviceLevel === 'rush' ? RUSH_SURCHARGE_CENTS : 0;
  return base + surcharge;
}
