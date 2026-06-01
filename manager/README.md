# Managers (Business Logic + IoC Container)

Business-logic manager classes wired together via a centralized IoC container. Each manager encapsulates a domain concern and is constructor-injected with its dependencies.

## Files

| File | Role |
|------|------|
| `ioc.manager.js` | IoC container — instantiates all providers, managers, and external clients. The single wiring point for the entire system. |
| `user.manager.js` | User CRUD, web push, remaining days, storage quotas |
| `device.manager.js` | Device CRUD, MQTT credentials, registration |
| `sensor.manager.js` | Sensor CRUD, attach/detach to devices |
| `actuator.manager.js` | Actuator CRUD, attach/detach to devices |
| `location.manager.js` | Location CRUD |
| `log.manager.js` | Log CRUD + InfluxDB writes |
| `command.manager.js` | Command CRUD for device command queue |
| `subscriber.manager.js` | SMS subscriber management |
| `deviceType.manager.js` | Device type CRUD |
| `socket.manager.js` | Socket.io connection tracking |
| `image.manager.js` | Image CRUD, file I/O, Jimp processing |
| `archive.manager.js` | Archive CRUD, video file management |
| `influx.manager.js` | InfluxDB telemetry writes |
| `auth.manager.js` | Auth token CRUD |
| `notify.manager.js` | SMS notifications via Kavenegar |
| `verbose.manager.js` | Verbose/debug data storage |
| `mqtt.manager.js` | MQTT publish/subscribe across 4 broker connections |
| `video.manager.js` | Video generation from image sequences via videoshow/ffmpeg |
| `memStorage.manager.js` | Redis key-value operations |
| `motionDetector.manager.js` | Motion detection via opencv4nodejs |
| `storage.manager.js` | Storage usage calculation via fast-folder-size |
| `apiBus.manager.js` | HTTP relay for Socket.io notifications |

## IoC Container (`ioc.manager.js`)

The brain of the system. It:

1. Requires and configures all external clients (MQTT ×4, Redis, InfluxDB, Kavenegar, web-push)
2. Instantiates all 7 providers with their clients
3. Instantiates all 23 managers with their dependencies (models, providers, utilities)
4. Exports a constructor function that provides `this.manager` with all manager instances

### External Clients (initialized in IoC)

| Client | Config | Purpose |
|--------|--------|---------|
| `hushiarClient` | `mqtt.hushiar.com:1773` | Primary Hushiar MQTT broker |
| `hivemqPrivateClient` | `s1.eu.hivemq.cloud:8883` (MQTTS) | Private HiveMQ broker |
| `hivemqClient` | `broker.hivemq.com` | Public HiveMQ broker |
| `emqxClient` | `broker.emqx.io` | Public EMQX broker |
| `redisClient` | `127.0.0.1:6379` | Redis for caching/state |
| `kavenegarClient` | API key | SMS provider |
| `webpush` | VAPID keys | Web push notifications |
| `InfluxDB` | Cloud InfluxDB (eu-central) | Time-series telemetry |

### Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `CAMERA_IMAGE_STORAGE_PATH` | `/projects/homeSecurity/server/storage/images` | Image storage directory |
| `CAMERA_VIDEO_STORAGE_PATH` | `/projects/homeSecurity/server/storage/video` | Video storage directory |
| `ARCHIVE_VIEDO_DURATION_MIN` | `1` | Archive video interval in minutes |
| `monitoringDurationSecond` | `5` | Motion monitoring window |

## Pattern

All managers use the constructor-function module pattern:

```js
exports = module.exports = function(options) {
  // receive dependencies via options
  this.methodName = methodName; // expose methods on `this`
};
```

Dependencies are injected via the `options` object when the IoC container creates each instance.

## Notable

- All secrets (MQTT credentials, API keys, InfluxDB tokens, VAPID keys) are hardcoded as empty strings in `ioc.manager.js`.
- MongoDB connection string in `model/db.js` is also empty (`awsConnection = ''`).
- No environment variable configuration — everything is hardcoded.
- The IoC container is shared across `admin/`, `app/`, and `device/` services (each creates its own instance).
- Scheduled jobs (cron) are NOT here — they live in `service/service.js`.
