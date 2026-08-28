import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import {
  DELIVERY_WINDOW_SURCHARGE_CENTS,
  DISTANCE_BANDS,
  FREE_DELIVERY_SUBTOTAL_CENTS,
  MAX_DELIVERY_FEE_CENTS,
  RUSH_SURCHARGE_CENTS,
  SMALL_ORDER_SURCHARGE_CENTS,
  SMALL_ORDER_SURCHARGE_FLOOR_CENTS,
  WEIGHT_BANDS,
} from './quote.js';

const app = buildApp();
const post = (payload: unknown) =>
  app.inject({ method: 'POST', url: '/quotes', payload: payload as object });
const get = () => app.inject({ method: 'GET', url: '/rules' });

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

  it('caps the delivery fee and appends a final cap line when needed', async () => {
    const res = await post({
      subtotalCents: 1000,
      distanceKm: 20,
      serviceLevel: 'rush',
      weightGrams: 25000,
      deliveryWindow: 'weekend',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      deliveryFeeCents: MAX_DELIVERY_FEE_CENTS,
      breakdown: [
        { code: 'base', amountCents: 1500 },
        { code: 'rush', amountCents: 300 },
        { code: 'weight', amountCents: 500 },
        { code: 'small-order', amountCents: 200 },
        { code: 'delivery-window', amountCents: 400 },
        { code: 'cap', amountCents: -900 },
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

  it.each([
    [
      'all surcharges stack in fixed order',
      {
        subtotalCents: 1200,
        distanceKm: 4,
        serviceLevel: 'rush',
        weightGrams: 6000,
        deliveryWindow: 'weekend',
      },
      [
        { code: 'base', amountCents: 500 },
        { code: 'rush', amountCents: 300 },
        { code: 'weight', amountCents: 200 },
        { code: 'small-order', amountCents: 200 },
        { code: 'delivery-window', amountCents: 400 },
      ],
      1600,
    ],
    [
      'cap keeps breakdown equal to total when uncapped fee exceeds the maximum',
      {
        subtotalCents: 1000,
        distanceKm: 20,
        serviceLevel: 'rush',
        weightGrams: 25000,
        deliveryWindow: 'weekend',
      },
      [
        { code: 'base', amountCents: 1500 },
        { code: 'rush', amountCents: 300 },
        { code: 'weight', amountCents: 500 },
        { code: 'small-order', amountCents: 200 },
        { code: 'delivery-window', amountCents: 400 },
        { code: 'cap', amountCents: -900 },
      ],
      MAX_DELIVERY_FEE_CENTS,
    ],
    [
      'free delivery still keeps surcharges and order',
      {
        subtotalCents: 5000,
        distanceKm: 40,
        serviceLevel: 'rush',
        weightGrams: 6000,
        deliveryWindow: 'evening',
      },
      [
        { code: 'base', amountCents: 0 },
        { code: 'rush', amountCents: 300 },
        { code: 'weight', amountCents: 200 },
        { code: 'delivery-window', amountCents: 200 },
      ],
      700,
    ],
  ])('%s', async (_name, payload, expectedBreakdown, expectedTotal) => {
    const res = await post(payload);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      deliveryFeeCents: expectedTotal,
      breakdown: expectedBreakdown,
    });
    expect(
      res
        .json()
        .breakdown.reduce(
          (sum: number, line: { amountCents: number }) => sum + line.amountCents,
          0,
        ),
    ).toBe(expectedTotal);
    expect(res.json().breakdown.map((line: { code: string }) => line.code)).toEqual(
      expectedBreakdown.map((line) => line.code),
    );
  });
});

describe('GET /rules', () => {
  it('returns the published pricing rules', async () => {
    const res = await get();
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      freeDeliverySubtotalCents: FREE_DELIVERY_SUBTOTAL_CENTS,
      maxDeliveryFeeCents: MAX_DELIVERY_FEE_CENTS,
      distanceBands: DISTANCE_BANDS,
      rushSurchargeCents: RUSH_SURCHARGE_CENTS,
      weightBands: WEIGHT_BANDS,
      smallOrderFloorCents: SMALL_ORDER_SURCHARGE_FLOOR_CENTS,
      smallOrderSurchargeCents: SMALL_ORDER_SURCHARGE_CENTS,
      deliveryWindowSurchargeCents: DELIVERY_WINDOW_SURCHARGE_CENTS,
    });
  });

  it('publishes rules that match what POST /quotes charges', async () => {
    const rules = (await get()).json();
    const baseSubtotal = rules.freeDeliverySubtotalCents - 1;
    const baseQuote = await post({ subtotalCents: baseSubtotal, distanceKm: 4 });
    const freeDeliveryQuote = await post({
      subtotalCents: rules.freeDeliverySubtotalCents,
      distanceKm: 40,
    });
    const rushQuote = await post({
      subtotalCents: rules.freeDeliverySubtotalCents,
      distanceKm: 40,
      serviceLevel: 'rush',
    });
    const smallOrderQuote = await post({
      subtotalCents: rules.smallOrderFloorCents - 1,
      distanceKm: 4,
    });
    const atSmallOrderFloorQuote = await post({
      subtotalCents: rules.smallOrderFloorCents,
      distanceKm: 4,
    });
    const cappedQuote = await post({
      subtotalCents: 1000,
      distanceKm: 20,
      serviceLevel: 'rush',
      weightGrams: 25000,
      deliveryWindow: 'weekend',
    });

    for (const [index, band] of rules.distanceBands.entries()) {
      const distanceKm =
        band.maxKm ?? (rules.distanceBands[index - 1] as { maxKm: number }).maxKm + 1;
      const quote = await post({ subtotalCents: baseSubtotal, distanceKm });
      expect(quote.statusCode).toBe(200);
      expect(quote.json().breakdown[0]).toEqual({ code: 'base', amountCents: band.feeCents });

      if (band.maxKm !== null) {
        const nextQuote = await post({ subtotalCents: baseSubtotal, distanceKm: band.maxKm + 0.1 });
        expect(nextQuote.statusCode).toBe(200);
        expect(nextQuote.json().breakdown[0]).toEqual({
          code: 'base',
          amountCents: rules.distanceBands[index + 1].feeCents,
        });
      }
    }

    expect(freeDeliveryQuote.statusCode).toBe(200);
    expect(freeDeliveryQuote.json().breakdown[0]).toEqual({ code: 'base', amountCents: 0 });

    expect(rushQuote.statusCode).toBe(200);
    expect(rushQuote.json().deliveryFeeCents - freeDeliveryQuote.json().deliveryFeeCents).toBe(
      rules.rushSurchargeCents,
    );

    for (const [index, band] of rules.weightBands.entries()) {
      const weightGrams =
        band.maxGrams ?? (rules.weightBands[index - 1] as { maxGrams: number }).maxGrams + 1;
      const quote = await post({ subtotalCents: baseSubtotal, distanceKm: 4, weightGrams });
      expect(quote.statusCode).toBe(200);
      const weightLine = quote
        .json()
        .breakdown.find((line: { code: string }) => line.code === 'weight');
      expect(weightLine?.amountCents ?? 0).toBe(band.surchargeCents);
    }

    expect(baseQuote.statusCode).toBe(200);
    expect(smallOrderQuote.statusCode).toBe(200);
    expect(atSmallOrderFloorQuote.statusCode).toBe(200);
    expect(
      smallOrderQuote.json().deliveryFeeCents - atSmallOrderFloorQuote.json().deliveryFeeCents,
    ).toBe(rules.smallOrderSurchargeCents);

    for (const [deliveryWindow, surchargeCents] of Object.entries(
      rules.deliveryWindowSurchargeCents,
    )) {
      const quote = await post({ subtotalCents: baseSubtotal, distanceKm: 4, deliveryWindow });
      expect(quote.statusCode).toBe(200);
      expect(quote.json().deliveryFeeCents - baseQuote.json().deliveryFeeCents).toBe(
        surchargeCents,
      );
    }

    expect(cappedQuote.statusCode).toBe(200);
    expect(cappedQuote.json().deliveryFeeCents).toBe(rules.maxDeliveryFeeCents);
    expect(cappedQuote.json().breakdown.at(-1)).toEqual({ code: 'cap', amountCents: -900 });
  });
});
