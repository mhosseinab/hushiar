# Device API

Device-facing Express REST API. Handles device registration, telemetry ingestion, image upload, sensor/actuator attachment, log ingestion, command polling, and alarm state management.

## Port

`4003` (`api.device.hs`)

## Files

| File | Role |
|------|------|
| `hs_deviceAPI.js` | Express server, route definitions, multer image upload (~310 lines) |
| `hs_device.manager.js` | Business logic manager (~850 lines, largest file in legacy codebase) |

## Dependencies

- Express, body-parser, cors, multer, uuid, path, fs
- MongoDB via models (device, sensor, actuator, log, command, image, verbose, subscriber, archive)
- MQTT, InfluxDB, opencv4nodejs (motion detection), Jimp, redis (via IoC container in manager)

## Image Upload

Uses `multer.diskStorage` to store uploaded images:
- Destination: `/projects/homeSecurity/server/storage/images`
- Filename: `uuid.v4()` + original extension
- Uploaded via `multipart/form-data` with field name `imageFile`

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/isAlive` | None | Health check |
| GET | `/register/:deviceManufactureId` | None | Register device, generate MQTT credentials |
| POST | `/verbose` | None | Ingest verbose/debug data from device |
| GET | `/mvp/update_status` | None | Telemetry update via query params (MVP protocol) |
| POST | `/mvp/update_status` | None | Telemetry update via JSON body (MVP protocol) |
| POST | `/mvp/upload_image1` | None | Upload image (save to disk only, no DB record) |
| POST | `/mvp/upload_image` | None | Upload image + create DB record + log capture event |
| GET | `/sensor/attached` | None | Attach sensor to device (hardcoded IDs) |
| GET | `/sensor/detach` | None | Detach sensor from device |
| GET | `/actuator/attached` | None | Attach actuator to device |
| GET | `/actuator/detach` | None | Detach actuator from device |
| POST | `/device/heartBeat` | None | Device heartbeat (returns `{type: true}`) |
| POST | `/device/ingetLog` | None | Ingest log entry (reads `devicemanufactureid` header) |
| GET | `/device/getAllCommand` | None | Poll pending commands for device |
| POST | `/device/onAlarm` | None | Set device alarm state |
| POST | `/device/commandExecuteResult` | None | Report command execution result |

## MVP Telemetry Protocol (`/mvp/update_status`)

The core device communication endpoint. Accepts a flat query/body containing:
- Device identity (`manufactureId` embedded in data)
- Sensor readings (motion detector type + value)
- Actuator states (capture, light, buzzer, hazard beacon, monitoring, recording flags)
- Alarm state

The `mvpIngest()` function in the manager (~230 lines) handles:
1. Device lookup and creation if new
2. Sensor data processing (motion detection via opencv4nodejs)
3. Actuator state synchronization
4. InfluxDB telemetry write
5. Image capture trigger on motion
6. MQTT publish of state changes
7. Socket.io notification to user

## Device Identification

Device identity is passed via:
- URL parameter for `/register/:deviceManufactureId`
- `devicemanufactureid` header for `/device/ingetLog`, `/device/getAllCommand`, `/device/onAlarm`, `/device/commandExecuteResult`
- Embedded in telemetry data for MVP endpoints

No JWT or token-based auth — trust-based identification via manufactureId.

## Notable

- `/sensor/attached` has hardcoded manufacture IDs instead of reading from request.
- `/device/ingetLog` has a typo in the route (`ingetLog` instead of `ingestLog`).
- The manager (~850 lines) is a god object handling device registration, telemetry, image processing, motion detection, MQTT, and InfluxDB writes.
