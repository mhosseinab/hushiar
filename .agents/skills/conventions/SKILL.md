---
name: conventions
description: Documents the coding style, naming patterns, module structure, and architectural conventions used throughout the Hushiar codebase. Load this skill before editing any existing files or adding new code to ensure consistency.
---

# Hushiar — Coding Conventions

## Module Pattern — TypeScript Classes with DI

Every manager, provider, and service is a TypeScript class that receives dependencies via constructor injection:

```ts
import type { IDeviceModel } from '@hushiar/db-schema';
import type { IDevice, IDevicePopulated } from '@hushiar/shared-types';

export class DeviceManager {
  constructor(private readonly deviceModel: IDeviceModel) {}

  async getAll(): Promise<IDevicePopulated[]> {
    return this.deviceModel.find({}).populate('user location');
  }
}
```

**Key characteristics:**
- ES6 classes with explicit type annotations
- Dependencies injected via constructor (using `private readonly` shorthand)
- All methods are `async` — no `.then()/.catch()` chains
- Return types are explicitly typed with interfaces from `@hushiar/shared-types`
- Manager interfaces defined in `shared-types` for inversion of control

### What NOT to inject

Only **genuine dependencies** (models, providers, other managers) are constructor-injected. The following are imported directly at the top of the file — they are not constructor parameters:

| Import | Reason |
|--------|--------|
| `fs` / `fs/promises` | Node.js built-in |
| `uuid` | Stateless utility function |
| `Jimp` | Pure image processing — no connection/state |
| `videoshow` | Stateless video assembly library |
| `opencv4nodejs` (`cv`) | Stateless computer vision — no connection/state |
| `fastFolderSize` | Wrapped with `util.promisify` — stateless utility |

Rule of thumb: if it has no connection/state to initialize and no alternative implementation to swap in tests, import it directly.

## Workspace Package Naming

All internal packages use the `@hushiar/` scope:

| Package | Purpose |
|---------|----------|
| `@hushiar/shared-types` | Pure TypeScript type definitions |
| `@hushiar/db-schema` | Mongoose schemas and models |
| `@hushiar/providers` | External service adapters |
| `@hushiar/core` | Business logic managers |
| `@hushiar/device-api` | Device API app |
| `@hushiar/app-api` | App API app (includes scheduler) |
| `@hushiar/admin-api` | Admin API app |
| `@hushiar/live-api` | Live API app |
| `@hushiar/subscriber-api` | Subscriber API app |

## File Naming

| Pattern | Example | Used for |
|---------|---------|----------|
| `src/index.ts` | `apps/device-api/src/index.ts` | App entry point |
| `src/routes/*.ts` | `apps/device-api/src/routes/device.ts` | Express route definitions |
| `src/managers/*/index.ts` | `packages/core/src/managers/device/index.ts` | Manager class |
| `src/schemas/*.ts` | `packages/db-schema/src/schemas/device.ts` | Mongoose schema + typed model |
| `src/*.ts` | `packages/providers/src/redis.ts` | Provider class |
| `src/config.ts` | `apps/device-api/src/config.ts` | Env-based configuration |

## App Structure

Each app follows this layout:

```
apps/<name>/
├── package.json          ← scripts: dev, build, start, lint, typecheck
├── tsconfig.json         ← extends ../../tooling/typescript/tsconfig.node.json
└── src/
    ├── index.ts          ← Express app setup + server start + graceful shutdown
    ├── config.ts         ← env validation + config export (zod)
    ├── container.ts      ← composition root — wires providers, managers, routes
    ├── routes/
    │   ├── device.ts     ← route factory functions
    │   └── health.ts     ← /isAlive health check
    ├── middleware/
    │   ├── auth.ts       ← token-based auth middleware
    │   ├── error.ts      ← global error handler
    │   └── validate.ts   ← zod validation middleware
    └── scheduler.ts      ← croner jobs (app-api only)
```

### App Entry Point Pattern

```ts
// apps/device-api/src/index.ts
import express from 'express';
import { config } from './config.js';
import { DeviceManager } from '@hushiar/core';
import { DeviceModel } from '@hushiar/db-schema';
import { createDeviceRoutes } from './routes/device.js';
import { createHealthRoutes } from './routes/health.js';
import { errorHandler } from './middleware/error.js';

const app = express();
app.use(express.json());

// Wire dependencies (only what this app needs)
const deviceManager = new DeviceManager(DeviceModel);

// Mount routes
app.use(createHealthRoutes());
app.use(createDeviceRoutes(deviceManager));

// Error handler (last middleware)
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`device-api listening on :${config.port}`);
});
```

## Manager Method Naming

| Prefix | Purpose | Example |
|--------|---------|----------|
| `get` | Read/find operations | `getAll()`, `getByUser()`, `getByManufactureId()` |
| `getAll` | List all (optionally filtered) | `getAllByUser()`, `getAllByDevice()` |
| `set` | Update a field | `setOnAlarm()`, `setStorageUsage()` |
| `add` | Create new entity | `addDevice()`, `addSensor()` |
| `remove` | Delete | `removeByDevice()`, `removeAllByDevice()` |
| `ingest` | Receive external data | `ingestLog()`, `ingestVerbose()` |
| `generate` | Create derived output | `generateVideo()`, `generateToken()` |
| `attach`/`detach` | Link/unlink child entities | `attachSensor()`, `detachActuator()` |
| `reconcile` | Periodic consistency check | `reconcileStorage()` |

## Schema Pattern

Schemas use typed Mongoose interfaces:

```ts
// packages/db-schema/src/schemas/device.ts
import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { IDevice } from '@hushiar/shared-types';

export interface IDeviceDoc extends IDevice, Document {}
export interface IDeviceModel extends Model<IDeviceDoc> {}

const DeviceSchema = new Schema<IDeviceDoc, IDeviceModel>({
  registerDate: { type: Date, default: Date.now },
  title: { type: String, required: true },
  manufactureId: { type: String, required: true, unique: true },
  // ...
});

export const DeviceModel = mongoose.model<IDeviceDoc, IDeviceModel>('Device', DeviceSchema);
```

- Every schema has `registerDate: Date`
- References use typed ObjectId: `{ type: Schema.Types.ObjectId, ref: 'ModelName' }`
- Schemas use `enum` and `required` validators
- Entity interfaces defined in `@hushiar/shared-types`, schemas implement them

## Async Style

- **async/await everywhere** — no `.then()/.catch()` chains
- Route handlers use `async (req, res, next) => { try { ... } catch (err) { next(err) } }`
- Providers return native Promises (Redis 4.x, mqtt.js 5.x support this natively)
- No manual `new Promise()` wrappers

## Error Handling

Typed error classes with proper HTTP status codes:

```ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class AuthError extends AppError {
  constructor() {
    super('Access Denied', 403);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422);
  }
}
```

Global error handler middleware in each app:

```ts
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '@hushiar/shared-types';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  res.status(statusCode).json({ message: err.message });
}
```

## Configuration

- All config via environment variables, validated with zod at startup
- `.env.example` documents all required variables
- Config module per app: `apps/<name>/src/config.ts`

```ts
// apps/device-api/src/config.ts
import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  PORT: z.coerce.number().default(4003),
  MONGO_URI: z.string().url(),
  REDIS_URL: z.string().url(),
  MQTT_HUSHIAR_HOST: z.string(),
  // ...
});

export const config = envSchema.parse(process.env);
```

## TypeScript Configuration

All packages extend from shared configs in `tooling/typescript/`:

- `tsconfig.base.json` — strict mode, ES2022, bundler module resolution
- `tsconfig.node.json` — for Node.js server apps (extends base)

Each `tsconfig.json`:
```json
{
  "extends": "../../tooling/typescript/tsconfig.node.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src" },
  "include": ["src/**/*.ts"]
}
```

## Linting & Formatting

- **Biome** — single tool for linting + formatting
- Root `biome.json` applies to entire repo
- No ESLint, no Prettier
- `noVar: "error"` — enforce `const`/`let`, no `var`
- `noUnusedImports: "error"` — clean imports enforced
- 2-space indent, 100 char line width, single quotes

## MQTT Topic Convention

```
HSHYR_<deviceToken>/pub/<type>      — Device → Server
HSHYR_<deviceToken>/sub/<type>      — Server → Device
HSHYR_register                       — Device registration
```

Topic constants and types defined in `@hushiar/shared-types`:

```ts
export const MQTT_PREFIX = 'HSHYR';
export const MQTT_TOPICS = {
  REGISTER: 'HSHYR_register',
  IMAGE: 'Image',
  MOVING: 'Moving',
  DETECTOR: 'Detector',
  CAPTURE: 'Capture',
  BUZZER: 'Buzzer',
  BEACON: 'Beacon',
  RESOLUTION: 'resolution',
} as const;
```

## Storage Paths

- Configured via environment variables: `IMAGE_STORAGE_PATH`, `VIDEO_STORAGE_PATH`
- Default: `./storage/images/` and `./storage/video/`
- No hardcoded absolute paths
