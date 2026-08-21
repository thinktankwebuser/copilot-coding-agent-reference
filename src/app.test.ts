import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';

const app = buildApp();
const post = (payload: unknown) =>
  app.inject({ method: 'POST', url: '/quotes', payload: payload as object });

describe('POST /quotes', () => {
  it('returns the delivery fee', async () => {
    const res = await post({ subtotalCents: 3200, distanceKm: 4 });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ deliveryFeeCents: 500 });
  });

  it('ignores unknown fields', async () => {
    const res = await post({ subtotalCents: 3200, distanceKm: 4, extra: 'ignored' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ deliveryFeeCents: 500 });
  });

  it.each([
    ['missing distanceKm', { subtotalCents: 3200 }],
    ['missing subtotalCents', { distanceKm: 4 }],
    ['wrong type', { subtotalCents: '3200', distanceKm: 4 }],
    ['negative distance', { subtotalCents: 3200, distanceKm: -1 }],
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
