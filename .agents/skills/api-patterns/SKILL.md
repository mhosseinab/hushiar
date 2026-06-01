---
name: api-patterns
description: Documents the HTTP API surface, WebSocket channels, and MQTT topic protocol used across Hushiar services. Load this skill when adding, modifying, or debugging API endpoints, WebSocket events, or MQTT integrations.
---

# Hushiar — API, WebSocket & MQTT Protocol Reference

## HTTP Services

Each service is an app in `apps/` with typed Express routes.

### Device API (`apps/device-api/` — Port 4003)

IoT device-facing endpoints. Devices authenticate via device auth middleware (`src/middleware/deviceAuth.ts`) that validates the `devicemanufactureid` header against the Device collection. Only `/isAlive` and `/register/:manufactureId` are unauthenticated.

Image upload uses multer with limits: 10MB max, MIME type whitelist (jpeg/png/webp).

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/isAlive` | Health check | None |
| GET | `/register/:deviceManufactureId` | Register device, get MQTT token | manufactureId in URL |
| POST | `/verbose` | Ingest verbose/debug data | manufactureId header |
| GET | `/mvp/update_status` | Device status update (query params) | manufactureId header |
| POST | `/mvp/update_status` | Device status update (body) | manufactureId header |
| POST | `/mvp/upload_image` | Upload image + create DB record | manufactureId header |
| POST | `/sensor/attach` | Attach sensor to device | device auth |
| POST | `/sensor/detach` | Detach sensor from device | device auth |
| POST | `/actuator/attach` | Attach actuator to device | device auth |
| POST | `/actuator/detach` | Detach actuator from device | device auth |
| POST | `/device/heartBeat` | Device heartbeat | device auth |
| POST | `/device/ingestLog` | Ingest device log entry | device auth |
| GET | `/device/getAllCommands` | Get pending commands | device auth |
| POST | `/device/onAlarm` | Set alarm state on/off | device auth |
| POST | `/device/commandExecuteResult` | Report command execution result | device auth |

> **Migration note:** Legacy bugs fixed in new routes — GET routes with bodies changed to POST, typos corrected (`ingetLog` → `ingestLog`), hardcoded IDs replaced with header-based auth.

### App API (`apps/app-api/` — Port 4001)

Mobile app-facing REST API. Auth via `token` header.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/isAlive` | Health check |
| GET/POST | `/location/*` | Location CRUD |
| GET/POST | `/device/*` | Device CRUD, status changes, setup |
| GET | `/deviceType/*` | Device type listing |
| POST | `/subscriber/*` | Push notification subscription |
| GET | `/actuator/*` | Actuator listing |
| GET | `/image/*` | Image listing, retrieval |
| GET | `/sensor/*` | Sensor listing |
| GET | `/log/*` | Log listing by device/user |
| GET | `/archive/*` | Video archive listing, generation |
| POST | `/user/*` | User profile, payment |
| POST | `/auth/*` | Authentication (login, verify) |
| GET | `/video/*` | Video listing |

### Admin API (`apps/admin-api/` — Port 4004)

Back-office admin panel. Auth via `token` header.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/isAlive` | Health check |
| POST | `/device/add` | Add new device |
| GET | `/device/configList` | Get device config list |
| GET | `/device/getAll` | List all devices |
| GET | `/device/configList_download` | Download config as .txt |
| POST | `/sensor/add` | Add sensor |
| POST | `/actuator/add` | Add actuator |
| GET | `/image/getAll` | List all images |
| GET | `/image/getAllByDevice/:deviceId` | Get device images |
| GET | `/image/stream/:deviceId` | Assemble video from images |
| GET | `/user/getAll` | List all users |
| POST | `/user/notifyTest` | Send test notification |
| DELETE | `/log/byDevice/:deviceId` | Delete device logs |
| DELETE | `/archive/byDevice/:deviceId` | Delete device archives |

### Live API (`apps/live-api/` — Port 4005)

Live streaming WebSocket gateway. Minimal HTTP surface.

### Subscriber API (`apps/subscriber-api/` — Port 4002)

Socket.IO server with HTTP backbone. MQTT event forwarding.

## Route Definition Pattern

Routes are defined as factory functions that receive typed managers:

```ts
// apps/device-api/src/routes/device.ts
import { Router } from 'express';
import type { IDeviceManager } from '@hushiar/core';
import type { SetAlarmStateRequest, SetAlarmStateResponse } from '@hushiar/shared-types';

export function createDeviceRoutes(deviceManager: IDeviceManager): Router {
  const router = Router();

  router.post<{}, SetAlarmStateResponse, SetAlarmStateRequest>(
    '/device/onAlarm',
    async (req, res, next) => {
      try {
        const manufactureId = req.headers.devicemanufactureid as string;
        const { isOnAlarm } = req.body;
        const device = await deviceManager.setOnAlarm(manufactureId, isOnAlarm);
        res.json({ device });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
```

## WebSocket Channels

### App WebSocket (`apps/app-api/` — WS Port 4010)

Socket.IO server for real-time app events. Authentication via socket handshake.

- Connections tracked per user
- Events pushed to app clients: new log, motion detected, archive completed

### Live WebSocket (`apps/live-api/` — Port 4005)

Live streaming gateway.

### Subscriber WebSocket (`apps/subscriber-api/` — Port 4002)

Socket.IO server for forwarding MQTT events to subscribed clients.

## MQTT Protocol

### Topic Structure

```
HSHYR_register                     — Device registration (device → server)
HSHYR_<token>/pub/Image            — Image upload (device → server)
HSHYR_<token>/pub/Moving           — Motion detection (device → server)
HSHYR_<token>/pub/Detector         — Sensor event (device → server)
HSHYR_<token>/pub/Capture          — Capture actuator (device → server)
HSHYR_<token>/pub/Buzzer           — Buzzer actuator (device → server)
HSHYR_<token>/pub/Beacon           — Beacon actuator (device → server)
HSHYR_<token>/pub/resolution       — Resolution change (device → server)

HSHYR_<token>/sub/<type>           — Server → Device commands
HSHYR_<manufactureId>/setToken     — Token assignment during registration
```

Topic constants are defined in `@hushiar/shared-types`:

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

### Message Flow

1. `MqttProvider` subscribes to `HSHYR_register` on startup (single Hushiar broker)
2. When device registers via HTTP, server subscribes to `HSHYR_<token>/pub/#`
3. `MqttManager.translateTopic()` parses topic → method mapping
4. Callback functions dispatch to appropriate manager methods

### Provider Configuration

Single Hushiar self-hosted MQTT broker only. Legacy 4-broker fan-out (HiveMQ public/private, EMQX) was dropped — public brokers carried device traffic in cleartext.

| Env Var | Purpose |
|---------|----------|
| `HUSHIAR_MQTT_HOST` | Broker hostname |
| `HUSHIAR_MQTT_PORT` | Broker port |
| `HUSHIAR_MQTT_USERNAME` | Broker auth username |
| `HUSHIAR_MQTT_PASSWORD` | Broker auth password |
| `MQTT_PASSWORD_ENCRYPTION_KEY` | AES-256 key for encrypting device MQTT passwords at rest |

## Response Format

All HTTP endpoints return typed JSON:

**Success:**
```json
{ "<entity>": <data> }
```

**Error:**
```json
{ "message": "<error message>" }
```

Errors use proper HTTP status codes via typed error classes:
- `400` — Validation errors
- `403` — Auth errors
- `404` — Not found
- `500` — Internal errors

## Input Validation

All endpoints validate input with zod schemas:

```ts
// In @hushiar/shared-types
export const setAlarmStateSchema = z.object({
  isOnAlarm: z.boolean(),
});

// In route handler
import { validate } from '../middleware/validate.js';
import { setAlarmStateSchema } from '@hushiar/shared-types';

router.post('/device/onAlarm', validate(setAlarmStateSchema), async (req, res, next) => {
  // req.body is now typed and validated
});
```
