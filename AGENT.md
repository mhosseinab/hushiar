# AGENT.md — Operational Instructions for AI Agents
## Current State

This repo is a **legacy Node.js codebase in mid-migration** to a TypeScript monorepo. You will encounter two coexisting worlds:

- **Legacy code** — plain JS, `var`, `.then()/.catch()`, constructor-function DI, single `package.json`, PM2
- **New monorepo** — TypeScript, pnpm workspaces, Turborepo, Biome, `apps/` + `packages/`

The migration follows a strict phased order. **Never skip phases or work ahead.** Always check which phase is active before starting work.

## Skills

Load skills using the skill system. Do not guess at patterns — load the relevant skill first.

| Skill | When to Load | Priority |
|-------|-------------|----------|
| `migration-plan` | Before ANY migration work. Always load first. | **FIRST** |
| `typescript-migration` | When executing migration phases — has full transformation patterns and package templates | **SECOND** |
| `architecture` | When you need to understand service topology, data flows, or how things connect | On demand |
| `conventions` | Before editing ANY file — defines the target TypeScript patterns | Before coding |
| `api-patterns` | When adding/modifying API endpoints, WebSocket events, or MQTT topics | On demand |
| `data-model` | When working with schemas, queries, or database operations | On demand |
| `add-feature` | When extending the system with new functionality | On demand |
| `refactor-modernize` | When fixing bugs, updating deps, or improving code quality | On demand |

### Skill Loading Order

For a given task, load skills in this order:

1. `migration-plan` — understand where you are in the process
2. `conventions` — understand the target patterns before writing code
3. Task-specific skill (`api-patterns`, `data-model`, `add-feature`, etc.)

## Rules

### Absolute Rules (never violate)

1. **Never modify legacy code to add new features.** If the monorepo version of a service exists, extend that. If it doesn't exist yet, the migration for that service hasn't happened — ask the user.
   **Exception:** fixing bugs listed in `migration-plan` during migration is expected.
2. **Never use `any`.** If you need a type and it doesn't exist, add it to `@hushiar/shared-types`.
3. **Never hardcode secrets, ports, or paths.** All config comes from environment variables validated with zod.
4. **Never create circular dependencies between packages.** The DAG is: `shared-types` → `db-schema`/`providers` → `core` → `apps`.
5. **Never skip `typecheck`.** After any change, run `pnpm turbo run typecheck` for the affected packages.
6. **One app per session.** If migrating apps, pick one and finish it before touching another.

### Strong Rules (follow unless user explicitly overrides)

7. **Use `async/await` exclusively.** No `.then()/.catch()` chains in new code.
8. **Use TypeScript classes for managers and providers.** Not closures, not plain objects.
9. **Every API endpoint gets zod validation.** Define the schema in `@hushiar/shared-types/src/dto/`.
10. **Every Mongoose schema gets typed.** `IDoc` + `IModel` interfaces, `required: true`, `enum` constraints.
11. **Route definitions are factory functions.** `createXxxRoutes(manager): Router`, not inline `app.post()`.
12. **Fix bugs when you encounter them.** If you're touching a file that has a known typo (`temperture`, `remaningDays`, `staus`, `isAvaliable`, `hasHighTemperture`, etc.), fix it in the same change.
13. **Run Biome before committing.** `pnpm biome check --write .` on changed files.

### Coding Standards

14. **Imports:** use `import type` for type-only imports.
15. **Error handling:** typed `AppError` classes with HTTP status codes, global error middleware per app.
16. **Naming:** camelCase for functions/variables, PascalCase for classes/interfaces/types.
17. **File naming:** kebab-case for files (`device-type.ts`, `api-bus.ts`).
18. **Exports:** named exports only. No default exports.
19. **Dependencies:** declare all `workspace:*` deps in `package.json`. Never rely on transitive deps.

## Repository Map

### If working in the monorepo (`apps/` + `packages/`)

```
packages/shared-types/src/
├── entities/       ← IUser, IDevice, ISensor, etc.
├── dto/            ← zod schemas + request/response types
├── events/         ← MQTT topic constants, event payloads
├── managers/       ← IDeviceManager, IUserManager interfaces
└── errors/         ← AppError, NotFoundError, AuthError

packages/db-schema/src/
├── connection.ts   ← MongoDB connect (env-based)
└── schemas/        ← typed Mongoose models (one file per entity)

packages/providers/src/
├── mqtt/           ← MqttProvider (Hushiar self-hosted broker only)
├── redis.ts        ← RedisProvider (redis@4)
├── influx.ts       ← InfluxProvider
├── sms.ts          ← SmsProvider (Kavenegar)
└── web-push.ts     ← WebPushProvider (NEW)

packages/core/src/
└── managers/       ← business logic classes (one dir per domain)

apps/<name>/src/
├── index.ts        ← Express app setup + listen
├── config.ts       ← zod-validated env config
├── routes/         ← route factory functions
├── middleware/      ← auth, validation, error handler
└── manager.ts      ← app-specific wiring (if needed)
```

### If working in legacy code (pre-migration)

```
manager/ioc.manager.js   ← THE brain. All DI wiring. Providers + managers instantiated with hardcoded secrets.
model/db.js              ← MongoDB connection (empty connection string).
model/*.model.js         ← 14 Mongoose schemas (some with typos).
provider/*.prvd.js       ← External service adapters (hushyaarMqtt.prvd.js has filename bug).
device/hs_deviceAPI.js   ← Largest file (850 lines, god object).
service/service.js       ← Scheduled jobs.
live/hs_live.manager.js  ← 3 lines (empty).
subscriber/hs_subscriber.manager.js ← 0 bytes (stub).
```

## Common Commands

```bash
# Install dependencies (always from root)
pnpm install

# Type-check everything
pnpm typecheck

# Type-check specific package
pnpm turbo run typecheck --filter=@hushiar/core

# Lint everything
pnpm lint

# Lint and fix
pnpm biome check --write .

# Run dev server for one app
pnpm dev:device        # device-api
pnpm dev:app           # app-api (includes scheduler)
pnpm dev:admin         # admin-api
pnpm dev:live          # live-api
pnpm dev:subscriber    # subscriber-api

# Build everything (respects dependency order)
pnpm build

# Run tests
pnpm test
```

## Migration Status

Check the current phase before starting work. The phases are:

| Phase | Description | Key Details | Status |
|-------|-------------|-------------|--------|
| 0 | Scaffold monorepo (dirs + configs) | **9** workspaces, `.npmrc` for opencv hoisting | Check filesystem |
| 1 | `@hushiar/shared-types` | 14 interfaces, DTOs, events, errors | Check filesystem |
| 2 | `@hushiar/db-schema` | mongoose@8, 14 schemas, fix typos, MQTT password encryption | Check filesystem |
| 3 | `@hushiar/providers` | redis@4, **WebPushProvider** NEW, single Hushiar MQTT only, delete ga.prvd/hivemq/emqx | Check filesystem |
| 4 | `@hushiar/core` | 21 classes (apiBus DELETED), motion worker thread, socket lifecycle, web push fix, storage incremental | Check filesystem |
| 5a | `apps/live-api` | Thin wrapper (manager is 3 lines), socket.io@4 | Check filesystem |
| 5b | `apps/subscriber-api` | Stub (manager is 0 bytes, never deployed) | Check filesystem |
| 5c | `apps/admin-api` | CRUD | Check filesystem |
| 5d | `apps/device-api` | God file split, device auth middleware, multer limits | Check filesystem |
| 5e | `apps/app-api` | Scheduler from service.js, bug fixes, socket.io@4, graceful shutdown | Check filesystem |
| 6 | Quality (tests, CI, git hooks) | vitest, delete legacy dirs | Check filesystem |

To determine the active phase: check which directories exist under `packages/` and `apps/`. The first missing directory is the next phase to execute.

### Key Version Targets

mongoose@8, redis@4, socket.io@4, web-push@3.6+, jimp@1.x, croner (replaces node-schedule). Drop: node-fetch, body-parser, ffmpeg@0.0.4 (ffmpeg-stream stays), child_process npm dep, path npm dep, gulp, gulp-nodemon.

## What To Do If You're Unsure

1. **Load `migration-plan`** — it has the compressed context and execution order.
2. **Load `conventions`** — it has the target code patterns.
3. **Check filesystem** — see what already exists before creating anything.
4. **Ask the user** — if you can't determine the right phase or pattern, ask. Don't guess.

## .npmrc Is Critical

The `.npmrc` file **must** exist before running `pnpm install`. It hoists opencv native addons that would otherwise fail under pnpm's strict symlinking. If `pnpm install` was run without it, delete `node_modules` and reinstall.

```
public-hoist-pattern[]=*opencv*
public-hoist-pattern[]=*ffmpeg*
shamefully-hoist=false
```
