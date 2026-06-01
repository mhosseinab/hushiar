---
name: architecture
description: Provides a complete map of the Hushiar home surveillance system — service topology, folder roles, dependency graph, and data flows. Load this skill when you need to understand the project structure, navigate between services, or trace how data moves from edge devices to alerts.
---

# Hushiar — Architecture Map

## System Overview

Hushiar is a real-time home surveillance platform. Edge IoT devices detect motion and capture images. Data flows through HTTP APIs and MQTT brokers into a processing pipeline that persists telemetry, assembles video archives, and sends push/SMS alerts to users.

## Monorepo Structure

This repo is a **pnpm workspace monorepo** managed by **Turborepo**.

```
hushiar-monorepo/
├── apps/
│   ├── app-api/          ← Mobile app REST + WebSocket + scheduler (service.js merged)
│   ├── device-api/       ← IoT device HTTP API + device auth middleware
│   ├── admin-api/        ← Back-office admin API
│   ├── live-api/         ← Live streaming WebSocket (thin wrapper)
│   └── subscriber-api/   ← Stub HTTP server (never deployed)
├── packages/
│   ├── shared-types/     ← TypeScript interfaces, DTOs, events
│   ├── db-schema/        ← Mongoose schemas, models, DB connection
│   ├── providers/        ← External service adapters (MQTT, Redis, InfluxDB, SMS, WebPush)
│   └── core/             ← Business logic managers (21 classes, apiBus deleted)
├── tooling/
│   └── typescript/       ← Shared tsconfig files
├── pnpm-workspace.yaml
├── turbo.json
├── biome.json
└── package.json
```

## Service Topology (5 apps, 4 packages)

```
                    ┌─────────────────────────────────────┐
                    │           Infrastructure             │
                    │  MongoDB · InfluxDB · Redis · MQTT  │
                    └───────▲──────────▲──────────▲────────┘
                            │          │          │
        ┌───────────────────┼──────────┼──────────┼──────────────┐
        │                   │          │          │              │
  ┌─────┴───────┐  ┌───────┴───┐  ┌───┴────┐  ┌─┴──────────┐  ┌┴────────────┐
  │  device-api │  │  app-api  │  │ admin  │  │ subscriber │  │  live-api   │
  │  :4003      │  │  :4001    │  │ :4004  │  │  -api :4002 │  │  :4005      │
  └─────────────┘  │  WS:4010  │  └────────┘  │  (stub)     │  │  (wrapper)  │
                   │ scheduler │              └─────────────┘  └─────────────┘
                   └───────────┘
                        All apps import from packages:
                        @hushiar/core, @hushiar/shared-types
                        @hushiar/db-schema, @hushiar/providers
```

## Package Roles

### `@hushiar/shared-types`

Pure TypeScript type definitions. No runtime code, no dependencies.

- Entity interfaces: `IUser`, `IDevice`, `ISensor`, `IActuator`, `IImage`, `IArchive`, `ILog`, `ICommand`
- DTO types: request/response shapes for every API endpoint
- Event types: `MotionEvent`, `ImageCaptureEvent`, `DeviceRegisteredEvent`
- MQTT types: topic constants, message payloads, `TopicTranslation`
- Manager interfaces: `IDeviceManager`, `IUserManager`, etc.

### `@hushiar/db-schema`

Mongoose schemas, typed models, and DB connection.

- `src/connection.ts` — MongoDB connection using env-based config
- `src/schemas/*.ts` — One file per entity, typed with `IDoc`/`IModel` interfaces
- Exports typed models: `DeviceModel`, `UserModel`, `ImageModel`, etc.

### `@hushiar/providers`

External service adapters as TypeScript classes.

| Provider | Service | Purpose |
|----------|---------|--------|
| `MqttProvider` | Hushiar self-hosted MQTT broker | Pub/sub for device communication |
| `RedisProvider` | Redis | Caching, short-lived state |
| `InfluxProvider` | InfluxDB Cloud | Time-series telemetry |
| `SmsProvider` | Kavenegar | SMS notifications |
| `WebPushProvider` | web-push | Browser push notifications |

> **Note:** Legacy code used 4 MQTT brokers (HiveMQ public/private, EMQX, Hushiar) with a fan-out pattern and no deduplication. This was consolidated to the single Hushiar self-hosted broker. `WebPushProvider` is new — `web-push` was previously initialized inline in `ioc.manager.js`.

### `@hushiar/core`

Business logic managers as TypeScript classes.

```
@hushiar/core/src/managers/
├── user/          ← User CRUD, storage tracking, subscription days, web push
├── device/        ← Device CRUD, status management, MQTT password encryption
├── sensor/        ← Sensor attach/detach
├── actuator/      ← Actuator attach/detach
├── log/           ← Log ingestion, InfluxDB writes
├── image/         ← Image file management, storage size updates
├── archive/       ← Video archive creation
├── video/         ← ffmpeg video assembly
├── mqtt/          ← MQTT topic routing & callbacks (single Hushiar broker)
├── notify/        ← SMS & web push notifications (throttled, Promise.allSettled)
├── socket/        ← Socket.IO connection tracking (onConnect/onDisconnect lifecycle)
├── auth/          ← Authentication tokens
├── storage/       ← Storage quota (incremental updates + hourly reconciliation)
├── motion-detector/ ← Motion detection (worker thread, capped image buffer)
└── ...            ← 21 classes total (apiBus deleted)
```

## Build Dependency Graph

```
@hushiar/shared-types (no deps — pure types)
  ↑
  ├── @hushiar/db-schema     → shared-types
  ├── @hushiar/providers     → shared-types
  └── @hushiar/core          → shared-types, db-schema, providers

apps/device-api        → core, shared-types
apps/app-api           → core, shared-types  (includes scheduler)
apps/admin-api         → core, shared-types
apps/live-api          → core, shared-types
apps/subscriber-api    → core, shared-types
```

Turbo resolves this automatically via `"dependsOn": ["^build"]`.

## Key Data Flows

### 1. Motion Detection & Alerting
```
Device detects motion
  → MQTT publish to HSHYR_<token>/pub/Moving
  → MqttManager receives via provider callback
  → DeviceManager.movingStatusChanged()
  → LogManager.moving() → MongoDB + InfluxDB
  → NotifyManager.sendMovingAlert() → Kavenegar SMS (throttled 60s)
  → SocketManager.push to app via Socket.IO
```

### 2. Image Capture
```
Device POST /mvp/upload_image → apps/device-api (port 4003)
  → multer stores to IMAGE_STORAGE_PATH
  → DeviceManager.captureImage()
  → ImageManager creates MongoDB record
  → LogManager.imageCaptured()
```

### 3. Video Archiving (Scheduled — in app-api)
```
apps/app-api scheduler (croner) runs every ARCHIVE_DURATION_MIN minutes
  → DeviceManager.getAll()
  → For each device: ImageManager.getByDeviceAndTimeRange()
  → VideoManager.generateVideo() → ffmpeg
  → ArchiveManager.complete() → MongoDB Archive record
  → LogManager.videoArchived()
  → StorageManager updated incrementally on image save/delete
  → Hourly reconciliation via scheduler
```

### 4. Device Registration
```
Device GET /register/:manufactureId → apps/device-api
  → DeviceManager.registerDeviceToken()
  → Generates MQTT token
  → Subscribes to HSHYR_<token>/pub/#
  → Returns { token, mqttBroker }
```

## Process Management

- **Development:** `pnpm dev` runs all apps in watch mode via Turbo
- **Single app:** `pnpm dev:device` filters to one app
- **Build:** `pnpm build` builds all packages/apps in dependency order
- **Production:** Docker Compose or PM2 (each app has `start` script)

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Language | TypeScript 5.7+ |
| Package Manager | pnpm (workspaces) |
| Task Runner | Turborepo |
| Linting/Formatting | Biome |
| Web Framework | Express 5.x |
| Realtime | Socket.IO 4.x |
| Database | MongoDB via Mongoose 8.x |
| Time-Series | InfluxDB Client |
| Cache | Redis 4.x |
| Messaging | MQTT (mqtt.js 5.x) |
| Video | ffmpeg / videoshow |
| Validation | Zod |
| Testing | Vitest |

## How the Monorepo Tools Compose

| Concern | Tool | Mechanism |
|---------|------|-----------|
| Share code without npm | pnpm workspaces | `workspace:*` symlinks |
| Build in dependency order | Turborepo | `"dependsOn": ["^build"]` |
| Skip unchanged packages | Turbo cache | output hashing |
| CI: only changed packages | Turbo `--affected` | git diff |
| Consistent TS config | `tooling/typescript/` | `extends` inheritance |
| One lint/format config | Root `biome.json` | single config, all packages |
| Quality at commit time | `.githooks/pre-commit` | staged-file Biome check |
