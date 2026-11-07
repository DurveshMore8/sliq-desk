# SliqDesk – Ticket Management System

A small ticket management app built with Express (Node.js) and React, both in TypeScript.

## Setup

<!-- How to run the project, seeded logins, how to run tests and lint, how to trigger an SLA alert -->

_TBD_

## Architecture

<!-- A simple diagram and a short explanation of the main components and how they interact -->

_TBD_

## Key decisions

<!-- Important choices and trade-offs: tenant isolation, data model, auth, real-time, background processing -->

- **TypeScript on both frontend and backend** for type safety and shared understanding of data shapes.
- **Monorepo with a single `docker compose up`** so the whole app starts with one command.
- **Node 26 (LTS)** across both projects, the latest release line, supported until April 2029.
- **Express with `tsx` for dev and `tsc` for production builds**, with an ESM module setup.
- **`app.ts` / `index.ts` split** so the Express app can be tested without binding a port.
- **MongoDB with `organizationId` on every document** for tenant isolation; the org always comes from the server-side session, never from client input, and all queries go through a scoped data-access layer. Trade-off: unlike Postgres row-level security, isolation depends on that layer, so it is covered by dedicated tests.
- **SLA check runs as a scheduled loop in the API process, with the deadline stored in the database** so it survives restarts and can't double-fire. Trade-off: single-instance; see Next steps.
- **SSE via an in-memory per-organization emitter**, simple for one instance.

## API

<!-- How to explore the API: OpenAPI, a Postman collection or a short endpoint list -->

_TBD_

## Implementation status

<!-- Every requirement marked done / partial / not done. For anything not fully done: what is missing, why, how to finish it -->

_TBD_

## Assumptions

<!-- Anything decided where the brief was unclear -->

_TBD_

## Next steps

<!-- What to improve with more time, and what would change at 100x the load -->

- **Redis**: pub/sub so SSE works across multiple API instances, and a separate worker (BullMQ) for SLA jobs instead of the in-process loop. This is the main change at 100x load.

## AI usage

<!-- Tools used, what for, and one suggestion I rejected or corrected -->

_TBD_
