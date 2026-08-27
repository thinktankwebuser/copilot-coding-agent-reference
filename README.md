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
  "distanceKm": 4,
  "serviceLevel": "rush",
  "weightGrams": 6000,
  "deliveryWindow": "evening"
}
```

Response (`200 OK`):

```json
{
  "deliveryFeeCents": 1200,
  "breakdown": [
    { "code": "base", "amountCents": 500 },
    { "code": "rush", "amountCents": 300 },
    { "code": "weight", "amountCents": 200 },
    { "code": "delivery-window", "amountCents": 200 }
  ]
}
```

`subtotalCents` and `distanceKm` are required.

- `subtotalCents`: integer, minimum `0`
- `distanceKm`: number, minimum `0`
- `serviceLevel`: optional, `standard` (default) or `rush`
- `weightGrams`: optional integer, minimum `0`; omitted means no weight surcharge
- `deliveryWindow`: optional, `daytime` (default), `evening`, or `weekend`

The response always includes:

- `deliveryFeeCents`: the total delivery fee in cents
- `breakdown`: an itemised list of lines in fixed order: `base`, `rush`, `weight`, `small-order`, `delivery-window`

The `base` line is always present, including free delivery where its amount is `0`. Zero-value surcharges are omitted.

Unknown fields are ignored. Invalid requests return `400 Bad Request` with:

```json
{
  "error": "body must have required property 'distanceKm'"
}
```

Example:

```sh
curl -s -X POST http://localhost:3000/quotes \
  -H 'content-type: application/json' \
  -d '{"subtotalCents":3200,"distanceKm":4,"serviceLevel":"rush","weightGrams":6000,"deliveryWindow":"evening"}'
```

## Delivery rules

| Rule                                            | Amount                                       |
| ----------------------------------------------- | -------------------------------------------- |
| Distance up to and including `5` km             | base `500` cents                             |
| Distance over `5` km and up to `15` km          | base `1000` cents                            |
| Distance over `15` km                           | base `1500` cents                            |
| Subtotal `5000` cents or more                   | free delivery on the `base` line (`0` cents) |
| `serviceLevel` is `rush`                        | `+300` cents                                 |
| `weightGrams` up to and including `5000` g      | `+0` cents                                   |
| `weightGrams` over `5000` g and up to `20000` g | `+200` cents                                 |
| `weightGrams` over `20000` g                    | `+500` cents                                 |
| `subtotalCents` below `1500`                    | `+200` cents small-order surcharge           |
| `deliveryWindow` is `daytime`                   | `+0` cents                                   |
| `deliveryWindow` is `evening`                   | `+200` cents                                 |
| `deliveryWindow` is `weekend`                   | `+400` cents                                 |

Free delivery waives only the `base` line. Rush, weight, small-order, and delivery-window surcharges still apply, and the total always equals the sum of the returned `breakdown` lines.

### `GET /rules`

Response (`200 OK`):

```json
{
  "freeDeliverySubtotalCents": 5000,
  "distanceBands": [
    { "maxKm": 5, "feeCents": 500 },
    { "maxKm": 15, "feeCents": 1000 },
    { "maxKm": null, "feeCents": 1500 }
  ],
  "rushSurchargeCents": 300,
  "weightBands": [
    { "maxGrams": 5000, "surchargeCents": 0 },
    { "maxGrams": 20000, "surchargeCents": 200 },
    { "maxGrams": null, "surchargeCents": 500 }
  ],
  "smallOrderFloorCents": 1500,
  "smallOrderSurchargeCents": 200,
  "deliveryWindowSurchargeCents": {
    "daytime": 0,
    "evening": 200,
    "weekend": 400
  }
}
```

`null` means “and above” for the final distance and weight bands.

## Agent harness

This repository is also a working example of running GitHub Copilot coding agent against a real
codebase. The files below define how an agent is expected to work here.

| Path                                                                       | Purpose                                                                                                                                                                                                                               |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                                                                | The implementation contract every coding agent follows: the assigned Issue is the scope, `npm run verify` must pass, and unresolved consequential decisions are escalated in a `HUMAN DECISION REQUIRED` block instead of guessed at. |
| `.github/skills/implement-issue/SKILL.md`                                  | The step-by-step procedure for implementing an Issue: read the Issue, match existing patterns, make the smallest coherent change, verify, then review the PR diff.                                                                    |
| `CONTEXT.md`                                                               | The domain glossary. It defines the pricing vocabulary (quote, base fee, surcharge, breakdown, rules) and holds no implementation detail.                                                                                             |
| `experiments.md`                                                           | The plan for a series of experiments measuring what a human still has to supply when a coding agent does the implementation.                                                                                                          |
| `.github/workflows/copilot-setup-steps.yml`                                | Prepares the environment GitHub Copilot coding agent runs in.                                                                                                                                                                         |
| `.github/workflows/plan.md`                                                | A GitHub Agentic Workflows (gh-aw) definition: a `/plan` comment on an issue or discussion breaks the work into sub-issues. `plan.lock.yml` is the compiled output and is generated, not hand-edited.                                 |
| `.github/skills/agentic-workflows/`, `.github/agents/agentic-workflows.md` | Vendored gh-aw guidance for authoring and debugging those workflows.                                                                                                                                                                  |
| `.github/mcp.json`                                                         | Registers the local `gh aw mcp-server` so an agent can compile and inspect the workflows.                                                                                                                                             |
