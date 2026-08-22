import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';

const app = buildApp();
const post = (payload: unknown) =>
  app.inject({ method: 'POST', url: '/quotes', payload: payload as object });

describe('POST /quotes', () => {
  it('returns the delivery fee', async () => {
    const res = await post({ subtotalCents: 3200, distanceKm: 4 });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      deliveryFeeCents: 500,
      breakdown: [{ code: 'base', amountCents: 500 }],
    });
  });

  it('ignores unknown fields', async () => {
    const res = await post({ subtotalCents: 3200, distanceKm: 4, extra: 'ignored' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      deliveryFeeCents: 500,
      breakdown: [{ code: 'base', amountCents: 500 }],
    });
  });

  it('omitting serviceLevel uses standard fee', async () => {
    const res = await post({ subtotalCents: 3200, distanceKm: 4 });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      deliveryFeeCents: 500,
      breakdown: [{ code: 'base', amountCents: 500 }],
    });
  });

  it('serviceLevel standard uses existing fee', async () => {
    const res = await post({ subtotalCents: 3200, distanceKm: 4, serviceLevel: 'standard' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      deliveryFeeCents: 500,
      breakdown: [{ code: 'base', amountCents: 500 }],
    });
  });

  it('subtotal at the small-order floor with only required fields is unchanged', async () => {
    const res = await post({ subtotalCents: 1500, distanceKm: 4 });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      deliveryFeeCents: 500,
      breakdown: [{ code: 'base', amountCents: 500 }],
    });
  });

  it('serviceLevel rush adds 300-cent surcharge', async () => {
    const res = await post({ subtotalCents: 3200, distanceKm: 4, serviceLevel: 'rush' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      deliveryFeeCents: 800,
      breakdown: [
        { code: 'base', amountCents: 500 },
        { code: 'rush', amountCents: 300 },
      ],
    });
  });

  it('omitting weightGrams leaves the fee unchanged', async () => {
    const res = await post({ subtotalCents: 3200, distanceKm: 4, serviceLevel: 'rush' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      deliveryFeeCents: 800,
      breakdown: [
        { code: 'base', amountCents: 500 },
        { code: 'rush', amountCents: 300 },
      ],
    });
  });

  it('omitting deliveryWindow uses daytime fee with no extra line', async () => {
    const res = await post({ subtotalCents: 3200, distanceKm: 4, serviceLevel: 'rush' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      deliveryFeeCents: 800,
      breakdown: [
        { code: 'base', amountCents: 500 },
        { code: 'rush', amountCents: 300 },
      ],
    });
  });

  it('deliveryWindow daytime uses the existing fee', async () => {
    const res = await post({
      subtotalCents: 3200,
      distanceKm: 4,
      serviceLevel: 'rush',
      deliveryWindow: 'daytime',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      deliveryFeeCents: 800,
      breakdown: [
        { code: 'base', amountCents: 500 },
        { code: 'rush', amountCents: 300 },
      ],
    });
  });

  it('deliveryWindow evening adds a 200-cent surcharge', async () => {
    const res = await post({
      subtotalCents: 3200,
      distanceKm: 4,
      deliveryWindow: 'evening',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      deliveryFeeCents: 700,
      breakdown: [
        { code: 'base', amountCents: 500 },
        { code: 'delivery-window', amountCents: 200 },
      ],
    });
  });

  it('rush with free-delivery subtotal returns 300 cents', async () => {
    const res = await post({ subtotalCents: 5000, distanceKm: 40, serviceLevel: 'rush' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      deliveryFeeCents: 300,
      breakdown: [
        { code: 'base', amountCents: 0 },
        { code: 'rush', amountCents: 300 },
      ],
    });
  });

  it('weekend delivery applies under free delivery and stays last', async () => {
    const res = await post({
      subtotalCents: 1499,
      distanceKm: 4,
      serviceLevel: 'rush',
      weightGrams: 6000,
      deliveryWindow: 'weekend',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      deliveryFeeCents: 1600,
      breakdown: [
        { code: 'base', amountCents: 500 },
        { code: 'rush', amountCents: 300 },
        { code: 'weight', amountCents: 200 },
        { code: 'small-order', amountCents: 200 },
        { code: 'delivery-window', amountCents: 400 },
      ],
    });
  });

  it('weekend delivery also applies under free delivery without other surcharges', async () => {
    const res = await post({
      subtotalCents: 5000,
      distanceKm: 40,
      deliveryWindow: 'weekend',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      deliveryFeeCents: 400,
      breakdown: [
        { code: 'base', amountCents: 0 },
        { code: 'delivery-window', amountCents: 400 },
      ],
    });
  });

  it('adds weight surcharge under free delivery', async () => {
    const res = await post({ subtotalCents: 5000, distanceKm: 40, weightGrams: 6000 });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      deliveryFeeCents: 200,
      breakdown: [
        { code: 'base', amountCents: 0 },
        { code: 'weight', amountCents: 200 },
      ],
    });
  });

  it('adds weight after rush when both surcharges apply', async () => {
    const res = await post({
      subtotalCents: 3200,
      distanceKm: 4,
      serviceLevel: 'rush',
      weightGrams: 6000,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      deliveryFeeCents: 1000,
      breakdown: [
        { code: 'base', amountCents: 500 },
        { code: 'rush', amountCents: 300 },
        { code: 'weight', amountCents: 200 },
      ],
    });
  });

  it('adds small-order after base, rush, and weight when applicable', async () => {
    const res = await post({
      subtotalCents: 1499,
      distanceKm: 4,
      serviceLevel: 'rush',
      weightGrams: 6000,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      deliveryFeeCents: 1200,
      breakdown: [
        { code: 'base', amountCents: 500 },
        { code: 'rush', amountCents: 300 },
        { code: 'weight', amountCents: 200 },
        { code: 'small-order', amountCents: 200 },
      ],
    });
  });

  it.each([
    ['missing distanceKm', { subtotalCents: 3200 }],
    ['missing subtotalCents', { distanceKm: 4 }],
    ['wrong type', { subtotalCents: '3200', distanceKm: 4 }],
    ['negative distance', { subtotalCents: 3200, distanceKm: -1 }],
    ['invalid serviceLevel', { subtotalCents: 3200, distanceKm: 4, serviceLevel: 'express' }],
    ['invalid deliveryWindow', { subtotalCents: 3200, distanceKm: 4, deliveryWindow: 'night' }],
    ['non-string deliveryWindow', { subtotalCents: 3200, distanceKm: 4, deliveryWindow: 1 }],
    ['negative weight', { subtotalCents: 3200, distanceKm: 4, weightGrams: -1 }],
    ['fractional weight', { subtotalCents: 3200, distanceKm: 4, weightGrams: 1.5 }],
    ['non-numeric weight', { subtotalCents: 3200, distanceKm: 4, weightGrams: '6000' }],
  ])('rejects %s with 400', async (_name, payload) => {
    const res = await post(payload);
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: expect.any(String) });
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/quotes',
      headers: { 'content-type': 'application/json' },
      payload: '{not json',
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: expect.any(String) });
  });
});
