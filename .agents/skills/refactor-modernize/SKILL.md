---
name: refactor-modernize
description: Guides the modernization of the Hushiar codebase from legacy Node.js patterns to current best practices. Load this skill when planning or executing a refactoring pass — covers migration targets, priority order, and safe incremental steps.
---

# Hushiar — Refactoring & Modernization Guide

> **Note:** The full migration to TypeScript monorepo is covered in the `typescript-migration` skill. This skill covers incremental refactoring that can be done within either the old or new structure.

## Relationship to `typescript-migration`

The `typescript-migration` skill defines the **full migration path** from legacy JS to TypeScript monorepo. This skill covers:

- Refactoring patterns that apply regardless of structure
- Issues to fix during migration (not a separate phase)
- Quality improvements that benefit both old and new code

**If you are doing the TypeScript migration, follow `typescript-migration` first.** Use this skill for specific refactoring techniques.

## Issues to Fix During Migration

These are known bugs and quality issues in the legacy code. Fix them when you encounter the file during migration — don't make separate PRs for them.

### Bugs

| Issue | Location | Fix |
|-------|----------|-----|
| Typo: `staus` | `model/sensor.model.js`, `model/actuator.model.js` | Rename to `status` |
| Typo: `isAvaliable` | `model/deviceType.model.js` | Rename to `isAvailable` |
| Typo: `temperture` | `model/device.model.js` | Rename to `temperature` (migration alias) |
| Typo: `remaningDays` | `model/user.model.js` | Rename to `remainingDays` |
| Typo: `hasHighTemperture` | `model/archive.model.js` | Rename to `hasHighTemperature` |
| Duplicate `duration` field | `model/archive.model.js` | Keep Number, drop Date |
| Duplicate `credit` field | `model/user.model.js` | Defined twice — keep one |
| `Log.User` (capital U) | `model/log.model.js` | Rename to `log.user` |
| Typos in Influx measurements | `manager/log.manager.js` | `movment` → `movement`, `registraion` → `registration` |
| Typo: `exctractToken` | `manager/mqtt.manager.js` | Rename to `extractToken` |
| Typo: `onMoteionDetected` | `manager/motionDetector.manager.js` | Rename to `onMotionDetected` |
| Typo: `imagePahtList` | `manager/video.manager.js` | Rename to `imagePathList` |
| Typo: `handelSubscribtion` | `manager/mqtt.manager.js` | Rename to `handleSubscription` |
| GET routes reading `req.body` | `device/hs_deviceAPI.js` sensor/actuator routes | Change to POST or use query params |
| Typo: `ingetLog` | `device/hs_deviceAPI.js` | Rename to `ingestLog` |
| MQTT `unsubscribeToTopic` calls `subscribe()` | All 3 MQTT providers (`hivemq.prvd.js`, `emqx.prvd.js`, `hushyaarMqtt.prvd.js`) | Change to `mqttClient.unsubscribe()` |
| MQTT `publish()` references undefined constants | `manager/mqtt.manager.js` — `SET_RECORDING_TOPIC` etc. not defined | Define the missing topic constants or remove dead code paths |
| `locationId` undefined at L65 | `app/hs_appAPI.js` | Fix the variable reference — inject from `req.headers` or `req.query` |
| Typo: `getImageListt` | `app/hs_appAPI.js` L273 | Rename to `getImageList` |
| Hardcoded video path | `app/hs_appAPI.js` L291 | Replace with `VIDEO_STORAGE_PATH` env var |
| Dead `ffmpeg` import | `app/hs_appAPI.js` L3 | Remove the unused `ffmpeg@0.0.4` import |
| Web push early resolve | `manager/user.manager.js` — `resolve('feke done')` inside forEach | Remove debug line; use `Promise.allSettled()` for the notification loop |
| Web push fails for new users | `manager/user.manager.js` — `new Date(undefined)` → NaN | Handle `null`/`undefined` `lastWPDateTime` explicitly (treat as "never sent") |
| `throw err` inside Promise callback | `manager/storage.manager.js` — `fastFolderSize` callback | Crashes process; use `util.promisify` + try/catch |
| `apiBus` URLs all empty strings | `manager/apiBus.manager.js` | Dead code — every `fetch('')` is broken. Replace with direct integration or Redis pub/sub |
| Filename typo: `hushyaarMqtt.prvd.js` | `provider/hushyaarMqtt.prvd.js` | Rename to `hushiarMqtt.prvd.js` (extra 'a' in `hushyaar`) |

### Security

| Issue | Location | Fix |
|-------|----------|-----|
| Hardcoded empty secrets | `ioc.manager.js`, `influx.prvd.js` | Move to env vars |
| No auth on device API | `device/hs_deviceAPI.js` — all 16 routes unauthenticated | Add device token auth middleware; only `/register` and `/isAlive` stay public |
| No auth on `/device/getAll` | `app/hs_appAPI.js` | Add `checkAuth` middleware |
| No auth on `/actuator/getStream` | `app/hs_appAPI.js` | Add `checkAuth` middleware |
| No auth on `/internal/*` endpoints | `app/hs_appAPI.js` — `/internal/notifyUser`, `/internal/newImage`, `/internal/newLog` | Add service-to-service auth or restrict to localhost |
| No auth on `/socket/getAll` | `app/hs_appAPI.js` — leaks all connected users | Add `checkAuth` middleware |
| No input validation | All endpoints | Add zod schemas |
| No file upload limits | `device/hs_deviceAPI.js` — multer config has no `limits` or `fileFilter` | Add `limits: { fileSize: 10MB }` + file type whitelist |
| CORS allows `*` | All services | Restrict to known origins |
| MQTT credentials stored plaintext | `model/device.model.js` — `mqttUserName`, `mqttPassword` | Hash or encrypt in Phase 2 |
| `body-parser` CSRF | All POST routes | Add CSRF protection or use SameSite cookies |

### Structural

| Issue | Location | Fix |
|-------|----------|-----|
| God file (850 lines) | `device/hs_device.manager.js` | Split into focused modules |
| IoC container coupling | `manager/ioc.manager.js` | Each app wires its own deps via `container.ts` |
| Duplicated boilerplate | All `hs_xxxAPI.js` files | Shared Express setup module |
| `processSuccess/processError` | Every service | Centralized error middleware |
| No error status codes | All services return 400 | Typed errors with proper codes |
| MQTT 4-broker fan-out | `manager/mqtt.manager.js` — all messages published to all 4 brokers, no dedup | Consolidated to single Hushiar broker; HiveMQ and EMQX deleted entirely |
| apiBus dead code | `manager/apiBus.manager.js` — all URLs are empty strings | **DELETED** — service-worker merged into app-api, replaced by direct manager calls |
| Socket no disconnect handler | `manager/socket.manager.js` — `removeConnection` exists but never wired to `disconnect` event | SocketManager exposes `onConnect`/`onDisconnect` lifecycle; wired in app-api container |
| Motion detection blocks event loop | `manager/motionDetector.manager.js` — `cv.imread()` + OpenCV ops are synchronous | Offload to `worker_threads` via `motion-detector/worker.ts` |
| OpenCV `Mat` objects unbounded | `manager/motionDetector.manager.js` — `memoryImageList` holds full Mats in memory | Fixed-size cap (10 images) with FIFO eviction |
| `fs.existsSync` / `fs.mkdirSync` in hot path | `manager/video.manager.js` | Replace with async `fs.promises` equivalents |
| No partial ffmpeg cleanup | `manager/video.manager.js` + `service/service.js` — `.on('error')` logs but doesn't delete partial output | Add cleanup in error handler |

## Code Transformation Reference

### Pattern: Constructor-function → TypeScript Class

**Before:**
```js
var Device;
function getAll() { return Device.find({}); }
exports = module.exports = function(options) {
  Device = options.deviceModel;
  this.getAll = getAll;
};
```

**After:**
```ts
export class DeviceManager {
  constructor(private readonly deviceModel: IDeviceModel) {}
  async getAll(): Promise<IDevicePopulated[]> {
    return this.deviceModel.find({}).populate('user location');
  }
}
```

### Pattern: Promise chain → async/await

**Before:**
```js
app.post('/action', function(req, res) {
  manager.method(req.body.param)
    .then(function(result) { res.json({ result }); })
    .catch(function(err) { res.status(400).json({ message: err.message }); });
});
```

**After:**
```ts
app.post('/action', async (req, res, next) => {
  try {
    const result = await manager.method(req.body.param);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});
```

### Pattern: Callback wrapper → native Promise

**Before:**
```js
function set(key, value) {
  return new Promise(function(resolve, reject) {
    redisClient.set(key, value, (err, reply) => {
      if (err) reject(err);
      else resolve(reply);
    });
  });
}
```

**After:**
```ts
// Redis 4.x has native promises
async set(key: string, value: string): Promise<string> {
  return this.client.set(key, value);
}
```

### Pattern: Untyped schema → typed schema

**Before:**
```js
var DeviceSchema = new mongoose.Schema({
  registerDate: Date,
  title: String,
});
module.exports = mongoose.model('Device', DeviceSchema);
```

**After:**
```ts
const DeviceSchema = new Schema<IDeviceDoc, IDeviceModel>({
  registerDate: { type: Date, default: Date.now },
  title: { type: String, required: true },
});
export const DeviceModel = mongoose.model<IDeviceDoc, IDeviceModel>('Device', DeviceSchema);
```

## Dependency Update Targets

| Package | Current | Target | Breaking Changes |
|---------|---------|--------|-----------------|
| `mongoose` | 5.10.x | 8.x | Connection API, remove `mongoose.connect` callback |
| `redis` | 3.1.x | 4.x | Client creation, native promises |
| `socket.io` | 2.3.x | 4.x | CORS config, middleware API changed |
| `web-push` | 3.4.4 | 3.6+ | API stable, bump for security fixes |
| `jimp` | 0.16.x | 1.x | Major API changes — audit image manager calls at port time |
| `node-schedule` | 2.x | croner | TS-native, zero deps, same cron syntax |
| `express` | 4.17.x | 5.x | Router, async error handling improved |
| `uuid` | 8.x | 11.x | ESM-only, API changes |
| `node-fetch` | 2.x | Remove | Use native `fetch()` (Node 18+) |
| `body-parser` | standalone | Remove | Use `express.json()` built-in |
| `opencv4nodejs` | 5.6.x | Evaluate | Heavy native dep; consider `@techstark/opencv-js` |

## Testing Strategy

### Framework: Vitest

Each package has its own test suite:

```
packages/shared-types/  → compile-time type checks only
packages/db-schema/     → unit tests with mocked Mongoose
packages/providers/     → unit tests with mocked connections
packages/core/          → unit tests with mocked deps
apps/device-api/        → integration tests with supertest
```

### Test per phase boundary

After completing each migration phase, run:
```bash
pnpm turbo run typecheck lint test
```

All must pass before proceeding to the next phase.

### CI Pipeline

```bash
turbo run typecheck lint test build --affected
```

Only runs on packages that changed (and their dependents).
