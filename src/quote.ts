export const FREE_DELIVERY_SUBTOTAL_CENTS = 5000;

export function deliveryFeeCents(subtotalCents: number, distanceKm: number): number {
  if (subtotalCents >= FREE_DELIVERY_SUBTOTAL_CENTS) return 0;
  if (distanceKm <= 5) return 500;
  if (distanceKm <= 15) return 1000;
  return 1500;
}
