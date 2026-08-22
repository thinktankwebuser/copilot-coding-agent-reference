import Fastify, { type FastifyError } from 'fastify';
import { calculateDeliveryQuote, type DeliveryWindow, type ServiceLevel } from './quote.js';

type QuoteBody = {
  subtotalCents: number;
  distanceKm: number;
  serviceLevel?: ServiceLevel;
  weightGrams?: number;
  deliveryWindow?: DeliveryWindow;
};

const quoteBodySchema = {
  type: 'object',
  required: ['subtotalCents', 'distanceKm'],
  properties: {
    subtotalCents: { type: 'integer', minimum: 0 },
    distanceKm: { type: 'number', minimum: 0 },
    serviceLevel: { type: 'string', enum: ['standard', 'rush'] },
    weightGrams: { type: 'integer', minimum: 0 },
    deliveryWindow: { type: 'string', enum: ['daytime', 'evening', 'weekend'] },
  },
} as const;

export function buildApp() {
  // No type coercion: "3200" stays a string and is rejected. Unknown fields are ignored.
  const app = Fastify({ ajv: { customOptions: { coerceTypes: false } } });

  // Every error (validation, bad JSON, unknown route) gets the same small shape.
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    const statusCode = error.statusCode ?? 500;
    const message = statusCode < 500 ? error.message : 'Internal server error';
    reply.status(statusCode).send({ error: message });
  });

  app.post<{ Body: QuoteBody }>('/quotes', { schema: { body: quoteBodySchema } }, (request) => {
    const { subtotalCents, distanceKm, serviceLevel, weightGrams, deliveryWindow } = request.body;
    return calculateDeliveryQuote(
      subtotalCents,
      distanceKm,
      serviceLevel,
      weightGrams,
      deliveryWindow,
    );
  });

  return app;
}
