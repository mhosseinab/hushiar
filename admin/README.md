# Admin API

Plain Express + MongoDB CRUD API for device management and admin operations. No authentication, no validation, no message queues.

## Port

`4004` (`api.admin.hs`)

## Files

| File | Role |
|------|------|
| `hs_adminAPI.js` | Express server, route definitions |
| `hs_admin.manager.js` | Thin manager delegating to IoC container (`manager/ioc.manager.js`) |

## Dependencies

- Express, body-parser, cors
- MongoDB via IoC container (device, sensor, actuator, image, user, log, archive managers)
- `videoshow` (imported but only used inline in `/image/stream`)

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/isAlive` | None | Health check |
| POST | `/device/add` | None | Add device (auto-creates sensor + 3 actuators: Buzzer, Beacon, Capture) |
| GET | `/device/configList` | None | List device MQTT credentials (manufactureId, mqttUserName, mqttPassword) |
| GET | `/device/getAll` | None | List all devices |
| GET | `/device/configList_download` | None | Download device config as `.txt` attachment |
| GET | `/sensor/add` | None | Add sensor (hardcoded manufactureId/type) |
| POST | `/log/removeAllByDevice` | None | Delete all logs for a device |
| POST | `/archive/removeAllByDevice` | None | Delete all archives for a device |
| GET | `/actuator/add` | None | Add actuator (hardcoded manufactureId/type) |
| GET | `/image/getAll` | None | List all images |
| GET | `/image/getAll_device/:deviceId` | None | List images for device, renders HTML with CDN `<img>` tags |
| GET | `/image/stream/:deviceId` | None | Generate video from device images via `videoshow`/ffmpeg (incomplete — calls `videoshow()` twice) |
| GET | `/user/getAll` | None | List all users |
| POST | `/user/notifyTest` | None | Send test web-push notification to a user |

## Notable

- No authentication on any endpoint — purely internal/admin tool.
- `/sensor/add` and `/actuator/add` use hardcoded manufacture IDs (not from request).
- `/image/stream` has a bug: calls `videoshow()` a second time with no arguments after the first call.
- Manager uses constructor-function module pattern (`exports = module.exports = function() { this.method = fn }`).
