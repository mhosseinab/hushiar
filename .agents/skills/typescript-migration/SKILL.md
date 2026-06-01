---
name: typescript-migration
description: Master migration guide for converting Hushiar from a legacy multi-process Node.js repo to a TypeScript monorepo using pnpm workspaces, Turborepo, and Biome. Load this skill when planning, executing, or reviewing any migration work — it defines the target structure, package boundaries, migration order, and code transformation patterns.
---

# Hushiar — TypeScript Monorepo Migration Guide

## Target Structure (9 workspaces)

```
hushiar-monorepo/
├── apps/
│   ├── app-api/             ← app/       (ports 4001, 4010)  — largest surface + scheduler
│   ├── device-api/          ← device/    (port 4003)         — god file split
│   ├── admin-api/           ← admin/     (port 4004)
│   ├── live-api/            ← live/      (port 4005)         — thin wrapper
│   └── subscriber-api/      ← subscriber/(port 4002)         — stub
├── packages/
│   ├── shared-types/        ← NEW: TS interfaces, DTOs, events, MQTT constants
│   ├── db-schema/           ← model/     (mongoose@8 schemas + connection)
│   ├── providers/           ← provider/  (MQTT, Redis, InfluxDB, SMS, WebPush)
│   └── core/                ← manager/   (21 manager classes, IoC eliminated, apiBus DELETED)
├── tooling/typescript/      ← tsconfig.base + tsconfig.node
├── pnpm-workspace.yaml
├── turbo.json
├── biome.json
├── .npmrc                   ← CRITICAL: opencv native addon hoisting
├── .env.example
└── .githooks/pre-commit
```

## Dependency Version Targets

| Package | From | To | Breaking Changes |
|---------|------|----|-----------------|
| mongoose | 5.x | 8.x | `connect()` promise-only (no callback), `strictQuery` default changed, `findById` throws on cast error |
| redis | 3.x | 4.x | `createClient()` API changed, all methods async natively |
| socket.io | 2.x | 4.x | auth middleware signature changed, `socket.conn.close()` removed |
| node-fetch | 2.x | DELETE | Node 18+ global `fetch` |
| body-parser | standalone | DELETE | `express.json()` built-in |
| ffmpeg@0.0.4 | present | DELETE | dead import (never used) |
| child_process, path | npm deps | DELETE | Node built-ins, not npm packages |
| gulp, gulp-nodemon | present | DELETE | unused in monorepo |
| node-schedule | 2.x | evaluate | works, but consider `croner` (TS-native, zero deps) |

## Architectural Decisions

### Node builtins are direct imports, not constructor params
`fs`, `uuid`, `Jimp`, `videoshow`, `cv`, `fastFolderSize` become direct imports. Only genuine deps (Mongoose models, providers, other managers) stay as constructor params.

### Each app has `src/container.ts` (composition root)
Replaces `ioc.manager.js`. Each app reads env vars, instantiates only the providers and managers it needs.

### Cross-manager circular dep: notifyManager ↔ userManager
Extract `IUserSmsUpdater` interface with `setLastSMSDateTime`. `notifyManager` accepts `IUserSmsUpdater` — no circular import.

### fast-folder-size callback → util.promisify
Wrap inside `storageManager`. Not a provider, just an import.

### Empty managers
- `live/hs_live.manager.js` (3 lines) — no logic. Channel logic is in `socket.manager.js` (core).
- `subscriber/hs_subscriber.manager.js` (0 bytes) — stub. Port what exists.

### WebPushProvider — NEW provider (was inline)
`web-push` was initialized in `ioc.manager.js`. Now becomes `packages/providers/src/web-push.ts`.

---

## Workspace Configuration

### `pnpm-workspace.yaml`

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### `.npmrc` — MUST exist before `pnpm install`

```
public-hoist-pattern[]=*opencv*
public-hoist-pattern[]=*ffmpeg*
shamefully-hoist=false
```

Without this, `opencv4nodejs`, `opencv-motion-detector`, and `opencv-build` (native C++ addons) install but fail at runtime under pnpm's strict symlinking.

### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Build Dependency Graph

```
@hushiar/shared-types (no deps — pure types)
  ↑
  ├── @hushiar/db-schema     → shared-types
  ├── @hushiar/providers     → shared-types
  └── @hushiar/core          → shared-types, db-schema, providers

apps/app-api           → core, shared-types
apps/device-api        → core, shared-types
apps/admin-api         → core, shared-types
apps/live-api          → core, shared-types
apps/subscriber-api    → core, shared-types
```

### `tooling/typescript/tsconfig.base.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noUncheckedIndexedAccess": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### `tooling/typescript/tsconfig.node.json`

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "outDir": "./dist"
  }
}
```

### `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "rules": {
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error"
      },
      "style": {
        "useConst": "error",
        "noVar": "error"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  },
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single"
    }
  }
}
```

---

## Package Templates

### `packages/shared-types/package.json`

```json
{
  "name": "@hushiar/shared-types",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./entities": "./src/entities/index.ts",
    "./events": "./src/events/index.ts",
    "./dto": "./src/dto/index.ts",
    "./managers": "./src/managers/index.ts",
    "./errors": "./src/errors/index.ts"
  }
}
```

Source-level package — no build step. Consumers import `.ts` directly.

### `packages/db-schema/package.json`

```json
{
  "name": "@hushiar/db-schema",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./schemas": "./src/schemas/index.ts",
    "./connection": "./src/connection.ts"
  },
  "dependencies": {
    "@hushiar/shared-types": "workspace:*",
    "mongoose": "^8.9.0"
  }
}
```

### `packages/providers/package.json`

```json
{
  "name": "@hushiar/providers",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./mqtt": "./src/mqtt/index.ts",
    "./redis": "./src/redis.ts",
    "./influx": "./src/influx.ts",
    "./sms": "./src/sms.ts",
    "./web-push": "./src/web-push.ts"
  },
  "dependencies": {
    "@hushiar/shared-types": "workspace:*",
    "mqtt": "^5.10.0",
    "redis": "^4.7.0",
    "@influxdata/influxdb-client": "^1.9.0",
    "kavenegar": "^1.1.4",
    "web-push": "^3.6.0"
  }
}
```

### `packages/core/package.json`

```json
{
  "name": "@hushiar/core",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./managers/*": "./src/managers/*/index.ts"
  },
  "dependencies": {
    "@hushiar/shared-types": "workspace:*",
    "@hushiar/db-schema": "workspace:*",
    "@hushiar/providers": "workspace:*",
    "uuid": "^11.0.0",
    "videoshow": "^0.1.12",
    "jimp": "^0.16.1",
    "fast-folder-size": "^1.4.0"
  }
}
```

### App Example (`apps/device-api/package.json`)

```json
{
  "name": "@hushiar/device-api",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "biome check .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@hushiar/core": "workspace:*",
    "@hushiar/shared-types": "workspace:*",
    "@hushiar/db-schema": "workspace:*",
    "@hushiar/providers": "workspace:*",
    "express": "^5.1.0",
    "multer": "^1.4.5-lts.2",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/multer": "^1.4.12",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

---

## Code Transformation Patterns

### 1. Manager: closure → TypeScript class

**Before:**
```js
var Device;
function getAll() { return Device.find({}).populate('user location'); }
exports = module.exports = function(options) {
  Device = options.deviceModel;
  this.getAll = getAll;
};
```

**After:**
```ts
import type { IDeviceModel } from '@hushiar/db-schema';
import type { IDevicePopulated } from '@hushiar/shared-types';

export class DeviceManager {
  constructor(private readonly deviceModel: IDeviceModel) {}

  async getAll(): Promise<IDevicePopulated[]> {
    return this.deviceModel.find({}).populate('user location');
  }
}
```

### 2. Provider: callback wrap → native promise (redis@4)

**Before:**
```js
var redisClient;
function set(key, value) {
  return new Promise(function(resolve, reject) {
    redisClient.set(key, value, (err, reply) => {
      if (err) reject(err); else resolve(reply);
    });
  });
}
```

**After:**
```ts
import { createClient, type RedisClientType } from 'redis';

export class RedisProvider {
  private client: RedisClientType;

  constructor(url: string) {
    this.client = createClient({ url });
  }

  async connect(): Promise<void> { await this.client.connect(); }
  async set(key: string, value: string): Promise<string> { return this.client.set(key, value); }
  async get(key: string): Promise<string | null> { return this.client.get(key); }
}
```

### 3. Schema: untyped → typed (mongoose@8)

**Before:**
```js
var DeviceSchema = new mongoose.Schema({
  registerDate: Date, title: String, manufactureId: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});
module.exports = mongoose.model('Device', DeviceSchema);
```

**After:**
```ts
import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { IDevice } from '@hushiar/shared-types';

export interface IDeviceDoc extends IDevice, Document {}
export interface IDeviceModel extends Model<IDeviceDoc> {}

const DeviceSchema = new Schema<IDeviceDoc, IDeviceModel>({
  registerDate: { type: Date, default: Date.now },
  title: { type: String, required: true },
  manufactureId: { type: String, required: true, unique: true },
  type: { type: String, enum: ['MobileApp', 'A1', 'A2'], required: true },
  status: { type: String, enum: ['home', 'silentMonitoring', 'secureMonitoring'], default: 'home' },
  temperature: { type: Number, default: 0 },  // fixed: was temperture
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  location: { type: Schema.Types.ObjectId, ref: 'Location' },
  token: { type: String },
  mqttUserName: { type: String },
  mqttPassword: { type: String },
});

export const DeviceModel = mongoose.model<IDeviceDoc, IDeviceModel>('Device', DeviceSchema);
```

### 4. Route: .then chain → async/await + factory function

**Before:**
```js
app.post('/device/onAlarm', function(req, res) {
  manager.setDeviceOnAlarmState(req.headers.devicemanufactureid, req.body.isOnAlarm)
    .then(function(updatedDevice) { res.json({ device: updatedDevice }); })
    .catch(function(err) { res.status(400).json({ message: err.message }); });
});
```

**After:**
```ts
import { Router } from 'express';
import type { IDeviceManager } from '@hushiar/core';

export function createDeviceRoutes(deviceManager: IDeviceManager): Router {
  const router = Router();
  router.post('/device/onAlarm', async (req, res, next) => {
    try {
      const device = await deviceManager.setOnAlarm(
        req.headers.devicemanufactureid as string,
        req.body.isOnAlarm,
      );
      res.json({ device });
    } catch (err) { next(err); }
  });
  return router;
}
```

### 5. Composition root: IoC container → container.ts per app

**Before (single file for all services):**
```js
var ioc = new iocFile();
// Every process instantiates ALL 21 managers + 6 providers
```

**After (each app wires only what it needs):**
```ts
// apps/device-api/src/container.ts
import { DeviceManager } from '@hushiar/core';
import { DeviceModel } from '@hushiar/db-schema';
import { MqttProvider, RedisProvider } from '@hushiar/providers';
import { env } from './config.js';

export function createContainer() {
  const redisProvider = new RedisProvider(env.REDIS_URL);
  const mqttProvider = new MqttProvider(env.MQTT);
  const deviceManager = new DeviceManager(DeviceModel, mqttProvider);

  return { deviceManager, redisProvider, mqttProvider };
}
```

---

## `.env.example`

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/hushiar

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# InfluxDB
INFLUX_URL=
INFLUX_TOKEN=
INFLUX_ORG=
INFLUX_BUCKET=

# Web Push (VAPID)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:example@yourdomain.org

# SMS (Kavenegar)
KAVENEGAR_API_KEY=

# MQTT — Hushiar (self-hosted broker)
HUSHIAR_MQTT_HOST=mqtt.hushiar.com
HUSHIAR_MQTT_PORT=1773
HUSHIAR_MQTT_USERNAME=
HUSHIAR_MQTT_PASSWORD=
MQTT_PASSWORD_ENCRYPTION_KEY=

# Storage
CAMERA_IMAGE_STORAGE_PATH=./storage/images
CAMERA_VIDEO_STORAGE_PATH=./storage/video

# Scheduler
ARCHIVE_VIDEO_DURATION_MIN=1
MONITORING_DURATION_SECOND=5

# App Ports
DEVICE_API_PORT=4003
APP_API_PORT=4001
APP_WS_PORT=4010
ADMIN_API_PORT=4004
LIVE_API_PORT=4005
SUBSCRIBER_API_PORT=4002
```

---

## Migration Phases

### Phase 0: Scaffold the Monorepo

Create in this order:
1. `.npmrc` (opencv hoisting — must exist before install)
2. `pnpm-workspace.yaml`
3. `turbo.json`
4. `biome.json`
5. Root `package.json` (with `"packageManager": "pnpm@9"`)
6. `tooling/typescript/tsconfig.base.json` + `tsconfig.node.json`
7. `.env.example`
8. Empty `package.json` + `tsconfig.json` for all **9** workspaces
9. `pnpm install` — verify workspace graph + opencv hoisting

### Phase 1: `@hushiar/shared-types`

14 entity interfaces (all 13 schemas + IStorage designed from scratch).
Fix field typos in interfaces: `remaningDays→remainingDays`, `temperture→temperature`, duplicate `duration`.
Events: `MotionEvent`, `ImageCaptureEvent`, `TopicTranslation`, `MQTT_TOPICS` constants.
DTOs per endpoint. Manager interfaces. Error classes.

### Phase 2: `@hushiar/db-schema` (mongoose@8)

`connection.ts` — `mongoose.connect()` is promise-only, no callback.
14 typed schemas. Each: `IDoc`, `IModel`, `Schema<IDoc>`, exported `Model`.
Fix: `remaningDays→remainingDays`, `temperture→temperature`, duplicate `duration`, `Log.User→user`.
`storage.ts` designed from scratch (source is 0 bytes).

### Phase 3: `@hushiar/providers`

6 providers → 6 (single MQTT, add WebPushProvider):
- `redis.ts` — redis@4, full API rewrite
- `influx.ts` — env-based config
- `mqtt/index.ts` — single Hushiar self-hosted broker only (fix filename: was `hushyaarMqtt`)
- `sms.ts` — Kavenegar
- `web-push.ts` — NEW (was inline in ioc.manager.js)
- Delete `ga.prvd.js` (0 bytes, unused)
- Delete `hivemq.prvd.js`, `emqx.prvd.js` — external brokers never used in production
- Drop HiveMQ and EMQX entirely — only the Hushiar self-hosted broker remains

### Phase 4: `@hushiar/core`

22 manager closures → 21 classes (apiBus DELETED). Only models/providers/managers as constructor params.
Fix: `handelSubscribtion→handleSubscription`, Influx `movment→movement`, `registraion→registration`.
`notifyManager` accepts `IUserSmsUpdater` (breaks circular dep).
`storageManager` wraps `fastFolderSize` with `util.promisify`.
**`apiBusManager` → DELETED** — empty URLs, never worked. Remove all references.
Motion detection uses `worker_threads` instead of spawning separate processes.
Socket manager gains lifecycle methods (`onConnect`, `onDisconnect`, `onError`).
MQTT password encryption/decryption handled in `deviceManager` using `MQTT_PASSWORD_ENCRYPTION_KEY`.
Export pure classes — no wiring (that's each app's `container.ts`).

### Phase 5: Apps (one at a time)

**5a. live-api** — thin wrapper. Channel logic is in `socket.manager.js` (core). socket.io@4.
**5b. subscriber-api** — stub (manager is 0 bytes). Port what exists.
**5c. admin-api** — CRUD endpoints.
**5d. device-api** — split god file into modules. `multer` as direct dep. Device auth middleware validates `devicemanufactureid` header. Multer configured with 10MB limit and MIME type filter.
**5e. app-api** — scheduler from `service.js` merged into `src/scheduler.ts` (croner replaces node-schedule). Fix 3 bugs: `locationId` undefined (L65), `getImageListt` double-t (L273), hardcoded video path (L291). Remove dead `ffmpeg` import (L3). Delete `/internal/*` routes (never used externally). socket.io@4 auth with lifecycle methods wired. Graceful shutdown handles active connections + scheduler stop.

### Phase 6: Quality

1. vitest per package
2. `.githooks/pre-commit`
3. CI: `turbo run typecheck lint test build --affected`
4. Delete legacy: `ecosystem.config.js`, `model/`, `provider/`, `manager/`, `admin/`, `app/`, `device/`, `live/`, `service/`, `subscriber/`, root `package-lock.json`

---

## Root `package.json`

```json
{
  "name": "hushiar-monorepo",
  "private": true,
  "packageManager": "pnpm@9",
  "scripts": {
    "dev": "turbo run dev",
    "dev:device": "turbo run dev --filter=@hushiar/device-api",
    "dev:app": "turbo run dev --filter=@hushiar/app-api",
    "dev:admin": "turbo run dev --filter=@hushiar/admin-api",
    "dev:live": "turbo run dev --filter=@hushiar/live-api",
    "dev:subscriber": "turbo run dev --filter=@hushiar/subscriber-api",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "format": "biome format --write .",
    "precommit:staged": "node scripts/biome-staged.mjs",
    "prepare": "git config core.hooksPath .githooks"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.0.0",
    "turbo": "^2.5.0",
    "typescript": "^5.7.0"
  }
}
```

---

## Verification

After each phase: `tsc --noEmit` passes.
After each app: dev server starts + `/isAlive` returns 200.
After Phase 6: `turbo run typecheck lint test build` all clean.
