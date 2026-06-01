---
name: migration-plan
description: The single-source migration plan for converting Hushiar to a TypeScript monorepo. Load this skill before doing ANY migration work — it contains the compressed context, target structure, file mapping, and ordered task list.
---

# Hushiar — Migration Plan (Compressed)

## Target Versions

| Package | From | To | Why |
|---------|------|----|-----|
| mongoose | 5.x | 8.x | strictQuery default changed, connect() is promise-only, findById throws on cast error |
| redis | 3.x | 4.x | createClient() API changed, all methods are async natively |
| socket.io | 2.x | 4.x | auth middleware signature changed, socket.conn.close() removed |
| web-push | 3.4.4 | 3.6+ | API stable, bump for security fixes |
| jimp | 0.16.x | 1.x | Major API changes — audit image manager calls at port time |
| node-schedule | 2.x | croner | TS-native, zero deps, same cron syntax |
| express | 4.17.x | 5.x | Router, async error handling improved |
| uuid | 8.x | 11.x | ESM-only, API changes |
| node-fetch | 2.x | DELETE | Node 18+ global fetch |
| body-parser | standalone | DELETE | express.json() built-in |
| ffmpeg@0.0.4 | present | DELETE | dead import, never used (ffmpeg-stream stays) |
| child_process, path | npm deps | DELETE | Node built-ins, not npm packages |
| gulp, gulp-nodemon | present | DELETE | unused in monorepo |

## Target Structure (9 packages: 4 lib + 5 apps)

```
hushiar-monorepo/
├── apps/
│   ├── app-api/             ← app/ + service/ (ports 4001, 4010) — REST + WebSocket + scheduler
│   ├── device-api/          ← device/    (port 4003)         — god file split, device auth
│   ├── admin-api/           ← admin/     (port 4004)
│   ├── live-api/            ← live/      (port 4005)         — thin wrapper
│   └── subscriber-api/      ← subscriber/(port 4002)         — stub (never deployed)
├── packages/
│   ├── shared-types/        ← NEW: TS interfaces, DTOs, events, MQTT constants
│   ├── db-schema/           ← model/     (mongoose@8 schemas + connection)
│   ├── providers/           ← provider/  (MQTT Hushiar only, Redis, InfluxDB, SMS, WebPush)
│   └── core/                ← manager/   (21 manager classes, apiBus DELETED, IoC eliminated)
├── tooling/typescript/      ← tsconfig.base + tsconfig.node
├── pnpm-workspace.yaml
├── turbo.json
├── biome.json
├── .npmrc                   ← CRITICAL: opencv native hoisting
└── .env.example
```

## File Map (old → new)

| Legacy JS | Target TS |
|-----------|-----------|
| `manager/ioc.manager.js` | **DELETED** — each app gets `src/container.ts` |
| `manager/apiBus.manager.js` | **DELETED** — empty URLs, replaced by direct manager calls |
| `manager/*.manager.js` (21 remaining) | `packages/core/src/managers/*/index.ts` |
| `model/db.js` | `packages/db-schema/src/connection.ts` |
| `model/*.model.js` (14 files) | `packages/db-schema/src/schemas/*.ts` |
| `provider/redis.prvd.js` | `packages/providers/src/redis.ts` (redis@4 API) |
| `provider/influx.prvd.js` | `packages/providers/src/influx.ts` |
| `provider/hivemq.prvd.js` | **DELETED** — 4-broker fan-out consolidated to single Hushiar broker |
| `provider/emqx.prvd.js` | **DELETED** — same reason |
| `provider/hushyaarMqtt.prvd.js` | `packages/providers/src/mqtt/index.ts` (single MqttProvider, fix filename typo) |
| `provider/kavenegar.prvd.js` | `packages/providers/src/sms.ts` |
| `provider/ga.prvd.js` | **DELETED** (0 bytes, unused) |
| (in ioc.manager.js) | `packages/providers/src/web-push.ts` (NEW — was inline) |
| `device/hs_deviceAPI.js` + `.manager.js` | `apps/device-api/src/` (manager split into modules) |
| `app/hs_appAPI.js` + `.manager.js` | `apps/app-api/src/` |
| `app/hs_appWS.js` | **DELETED** — dev test harness, no real logic |
| `service/service.js` | `apps/app-api/src/scheduler.ts` (merged, croner replaces node-schedule) |
| `admin/hs_adminAPI.js` + `.manager.js` | `apps/admin-api/src/` |
| `live/hs_liveAPI.js` | `apps/live-api/src/` (manager is empty — 3 lines) |
| `subscriber/hs_subscriberApi.js` | `apps/subscriber-api/src/` (manager is 0 bytes — stub) |
| `ecosystem.config.js` | **DELETED** — replaced by turbo |

## Bugs Fixed During Migration

**Schema typos:** `temperture` → `temperature`, `remaningDays` → `remainingDays`, `hasHighTemperture` → `hasHighTemperature`, `staus` → `status` (sensor + actuator), `isAvaliable` → `isAvailable` (deviceType)
**Schema bugs:** `Archive.duration` duplicate field → single field, `User.credit` duplicate field → single field, `Log.User` → `Log.user`
**Influx typos:** `movment` → `movement`, `registraion` → `registration`
**Code typos:** `handelSubscribtion` → `handleSubscription`, `exctractToken` → `extractToken`, `onMoteionDetected` → `onMotionDetected`, `imagePahtList` → `imagePathList`, `ingetLog` → `ingestLog`
**MQTT unsubscribe bug:** All 3 providers' `unsubscribeToTopic()` calls `subscribe()` instead of `unsubscribe()` — fix in Phase 3
**MQTT publish crash:** `publish()` references undefined topic constants (`SET_RECORDING_TOPIC`, etc.) — define or remove dead code paths
**MQTT consolidation:** HiveMQ (public + private) and EMQX dropped entirely. Single Hushiar self-hosted broker only. Public brokers carried device traffic in cleartext — indefensible for a security product.
**apiBus DELETED:** All target URLs were empty strings. Service-worker merged into app-api, so inter-process HTTP is eliminated. All call sites replaced with direct manager method calls.
**Service-worker merged into app-api:** Scheduler runs as `src/scheduler.ts` inside app-api. No IPC needed. `/internal/*` routes deleted.
**Web push bugs:** `resolve('feke done')` resolves before notifications send; `new Date(undefined)` causes NaN → silent failure for new users. Fix in Phase 4
**Storage crash:** `throw err` inside `fastFolderSize` callback crashes process. Fix with `util.promisify` + try/catch in Phase 4
**app-api bugs:** `locationId` undefined at L65, `getImageListt` double-t at L273, hardcoded video path at L291, dead `ffmpeg` import at L3
**Filename bug:** `hushyaarMqtt.prvd.js` has extra 'a' → becomes `hushiar.ts`
**Security:** hardcoded secrets → env vars, no auth on device-api or several app-api routes → token auth, multer no limits → add fileSize + fileFilter, no validation → zod

## Architectural Decisions

### Node builtins are direct imports, not constructor params
`fs`, `uuid`, `Jimp`, `videoshow`, `cv`, `fastFolderSize` — these become direct imports inside each manager. Only genuine dependencies (Mongoose models, provider instances, other managers) remain as constructor params.

### Cross-manager circular dependency: notifyManager ↔ userManager
`notifyManager` needs `userManager.setLastSMSDateTime`. Solution: extract `IUserSmsUpdater` interface with that single method. `notifyManager` accepts `IUserSmsUpdater` — no circular import.

### fast-folder-size is callback-based
Wrap with `util.promisify` inside `storageManager`. Not a provider, just an import.

### Each app has a container.ts (composition root)
Replaces `ioc.manager.js`. Each app reads env vars, instantiates only the providers and managers it needs, and exports the wired object graph.

### Empty managers
- `live/hs_live.manager.js` (3 lines) — no logic. Live channel logic lives in `socket.manager.js` (core).
- `subscriber/hs_subscriber.manager.js` (0 bytes) — stub. Port what exists.

### WebPushProvider is a new provider (was missing)
`web-push` was initialized inline in `ioc.manager.js` with VAPID keys and injected into `userManager`. Now becomes `packages/providers/src/web-push.ts`.

### MQTT consolidation (4 brokers → 1, HiveMQ + EMQX dropped)
Legacy code fans out every publish/subscribe to 4 brokers simultaneously with no deduplication. Public brokers (broker.hivemq.com, broker.emqx.io) carried device traffic in cleartext. Only the Hushiar self-hosted broker is ported. `hivemq.prvd.js` and `emqx.prvd.js` are deleted — do not port. MqttProvider abstraction kept for future redundancy.

### apiBus DELETED + service-worker merged into app-api
`apiBus.manager.js` makes `fetch()` calls to empty-string URLs — it has never worked. The service-worker is merged into app-api as `src/scheduler.ts`, so inter-process HTTP is eliminated entirely. The `/internal/*` routes in app-api are deleted (replaced by direct manager method calls). This reduces the app count from 6 to 5.

### Device auth middleware (device-api)
All device-api routes except `/isAlive` and `/register/:manufactureId` require auth via `devicemanufactureid` header validated against the Device collection. Implemented as `src/middleware/deviceAuth.ts`.

### Multer file upload limits (device-api)
Image upload gets `limits: { fileSize: 10MB }` and `fileFilter` accepting only `image/jpeg`, `image/png`, `image/webp`.

### Motion detection worker thread
OpenCV runs synchronously on the main thread in legacy code. The TypeScript port offloads `cv.imread` + comparison to `worker_threads` via `motion-detector/worker.ts`. The manager class posts image paths and returns `Promise<boolean>`. `memoryImageList` gets a fixed-size cap (10 images) with FIFO eviction.

### Socket lifecycle methods
SocketManager exposes `onConnect(socket)` and `onDisconnect(socket)`. The app-api container wires both events. This fixes stale connection accumulation.

### MQTT password encryption at rest
`mqttPassword` stored plaintext in Device documents. Encrypt at rest using `MQTT_PASSWORD_ENCRYPTION_KEY` env var (AES-256). Encryption in device manager registration, decryption in MQTT provider auth.

### Storage monitoring: incremental + hourly reconciliation
Update `storageUsedSize` atomically on image save/delete. The cron job becomes a reconciliation pass running hourly (not per-minute).

### Graceful shutdown (app-api)
SIGTERM handler stops croner jobs, closes MQTT, disconnects MongoDB, closes HTTP server, then exits. Prevents orphaned ffmpeg processes.

## Execution Order

```
Phase 0: Scaffold monorepo (dirs + configs + .npmrc + .env.example)
Phase 1: @hushiar/shared-types  (14 interfaces, DTOs, events, errors)
Phase 2: @hushiar/db-schema     (mongoose@8, 14 schemas, connection.ts)
Phase 3: @hushiar/providers     (redis@4, web-push NEW, delete ga.prvd)
Phase 4: @hushiar/core          (21 classes — apiBus DELETED, Influx typo fixes, motion worker, socket lifecycle, web push fix, MQTT encryption)
Phase 5: Apps by complexity (5 apps, no service-worker):
         5a. live-api          (thin wrapper, socket.io@4)
         5b. subscriber-api    (stub, never deployed)
         5c. admin-api         (CRUD)
         5d. device-api        (god file split, device auth middleware, multer limits)
         5e. app-api           (scheduler from service.js, bug fixes, socket.io@4, graceful shutdown)
Phase 6: Quality (vitest, git hooks, CI, delete legacy)
```

## Verification (per phase)

After each phase: `tsc --noEmit` must pass.
After each app (Phase 5): `tsc --noEmit` + dev server starts + `curl localhost:<port>/isAlive` returns 200.
After Phase 6: `turbo run typecheck lint test build` all pass clean.

## Key Rules

1. Packages first, apps second
2. One app at a time
3. `pnpm turbo run typecheck` must pass at every phase boundary
4. Legacy JS stays until its app is fully migrated
5. No `any` types — Biome `noExplicitAny: warn`
6. All env vars validated at startup with zod
7. `.npmrc` must exist before `pnpm install` (opencv hoisting)
