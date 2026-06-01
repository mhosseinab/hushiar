# subscriber-api — @hushiar/subscriber-api

Stub HTTP server on **port 4002**.

> **Not deployed to production.** This service has no route handlers beyond the health check. It exists as a placeholder for future subscriber-specific features. There is no `start:subscriber` script in the legacy ecosystem config — the process was never registered for deployment.

---

## Current State

The entire implementation is a single file (`src/index.ts`) that starts an Express server with one health-check route:

```
GET /isAlive → { message: "api.subscriber.hs is Alive!" }
```

Nothing else is implemented.

---

## File Structure

```
apps/subscriber-api/
├── src/
│   └── index.ts          ← Express app, health check, startup, shutdown
├── package.json
└── tsconfig.json
```

There is no `container.ts`, `routes/`, `middleware/`, or `__tests__/` directory.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string (connected on startup, unused otherwise) |

---

## Graceful Shutdown

On `SIGTERM`, `subscriber-api`:

1. Disconnects from MongoDB (`mongoose.disconnect()`).
2. Exits with code `0`.

---

## Adding Features

If you add routes to this service:

1. Add an auth middleware (see `app-api/src/middleware/auth.ts` for reference).
2. Add managers and wire them directly in `src/index.ts`, or create a `src/container.ts` if the wiring grows.
3. Add route files to a new `src/routes/` directory.
4. Write tests in a new `src/__tests__/` directory using `supertest`.
5. Update this README with the route table.
