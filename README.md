# Delivery Quote API

A small, stateless HTTP API that returns a delivery fee for an order. Built with Node.js, TypeScript, and Fastify.

## Setup

Requires Node.js 22.

```sh
npm ci
```

## Development

```sh
npm run dev
```

Starts the server on `http://localhost:3000` (override with `PORT`) and restarts it when files change.

## Verification

```sh
npm run verify
```

Runs, in order: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`. Each can also be run on its own. The GitHub Actions workflow in `.github/workflows/verify.yml` runs the same command on pull requests and on pushes to `main`.

## API

### `POST /quotes`

Request:

```json
{
  "subtotalCents": 3200,
  "distanceKm": 4
}
```

Response (`200 OK`):

```json
{
  "deliveryFeeCents": 500
}
```

Both fields are required. `subtotalCents` must be a non-negative integer and `distanceKm` a non-negative number. Unknown fields are ignored. Invalid requests return `400 Bad Request` with:

```json
{
  "error": "body must have required property 'distanceKm'"
}
```

Example:

```sh
curl -s -X POST http://localhost:3000/quotes \
  -H 'content-type: application/json' \
  -d '{"subtotalCents":3200,"distanceKm":4}'
```

## Delivery rules

| Condition                         | Fee        |
| --------------------------------- | ---------- |
| Subtotal is 5000 cents or more    | 0 cents    |
| Distance up to and including 5 km | 500 cents  |
| Distance over 5 km, up to 15 km   | 1000 cents |
| Distance over 15 km               | 1500 cents |

The subtotal rule wins: an order of 5000 cents or more ships free at any distance.
