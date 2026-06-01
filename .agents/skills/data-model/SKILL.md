---
name: data-model
description: Documents all MongoDB schemas, InfluxDB measurements, Redis usage, and file storage structures in Hushiar. Load this skill when working with data models, writing queries, or modifying database schemas.
---

# Hushiar — Data Model Reference

## Package Location

All data models live in `packages/db-schema/`. Entity interfaces are defined in `packages/shared-types/`.

- `packages/db-schema/src/connection.ts` — MongoDB connection
- `packages/db-schema/src/schemas/*.ts` — Typed Mongoose schemas and models
- `packages/shared-types/src/entities/*.ts` — TypeScript interfaces

## MongoDB Schemas

### User

Interface: `IUser` in `@hushiar/shared-types`
Schema: `packages/db-schema/src/schemas/user.ts`

| Field | Type | Purpose |
|-------|------|---------|
| `registerDate` | Date | Account creation time |
| `title` | String | Display name |
| `mobileNumber` | String | Phone (used for SMS) |
| `email` | String | Email address |
| `isValid` | Boolean | Account active flag |
| `credit` | Number | Account balance |
| `wpSubList` | [Mixed] | Web Push subscription objects |
| `isMobileNumberConfirmed` | Boolean | Phone verification status |
| `lastWPDateTime` | Date | Last web push time |
| `lastSMSDateTime` | Date | Last SMS time (for throttling) |
| `storageMaxSize` | Number | Storage quota in MB |
| `storageUsedSize` | Number | Current usage in MB |
| `storageRemainedSize` | Number | Remaining in MB |
| `remainingDays` | Number | Subscription days left (fixed: was `remaningDays`) |

### Device

Interface: `IDevice` in `@hushiar/shared-types`
Schema: `packages/db-schema/src/schemas/device.ts`

| Field | Type | Purpose |
|-------|------|---------|
| `registerDate` | Date | Registration time |
| `title` | String | Device name |
| `manufactureId` | String | Unique hardware ID (UUID, unique index) |
| `type` | String (enum) | `MobileApp`, `A1`, `A2` |
| `status` | String (enum) | `home`, `silentMonitoring`, `secureMonitoring` |
| `isOn` | Boolean | Power state |
| `isMonitoring` | Boolean | Monitoring active |
| `isOnAlarm` | Boolean | Alarm state |
| `isMoving` | Boolean | Motion detected |
| `isLightOn` | Boolean | Light state |
| `temperature` | Number | Temperature reading (fixed: was `temperture`) |
| `user` | ObjectId → User | Owner |
| `location` | ObjectId → Location | Physical location |
| `token` | String | MQTT session token |
| `mqttUserName` | String | MQTT auth username |
| `mqttPassword` | String | MQTT auth password |

### Sensor

Interface: `ISensor` in `@hushiar/shared-types`
Schema: `packages/db-schema/src/schemas/sensor.ts`

| Field | Type | Purpose |
|-------|------|---------|
| `registerDate` | Date | — |
| `manufactureId` | String (unique) | Unique hardware ID |
| `type` | String (enum) | `Detector` |
| `status` | String (enum) | `active`, `silent`, `monitoring`, `online` (fixed: was `staus`) |
| `isAlive` | Boolean | Online status |
| `device` | ObjectId → Device | Parent device |

### Actuator

Interface: `IActuator` in `@hushiar/shared-types`
Schema: `packages/db-schema/src/schemas/actuator.ts`

| Field | Type | Purpose |
|-------|------|---------|
| `registerDate` | Date | — |
| `manufactureId` | String (unique) | Unique hardware ID |
| `type` | String (enum) | `Capture`, `Buzzer`, `Beacon`, `Light` |
| `status` | String (enum) | `active`, `silent`, `monitoring`, `online` (fixed: was `staus`) |
| `isAlive` | Boolean | Online status |
| `device` | ObjectId → Device | Parent device |

### Image

Interface: `IImage` in `@hushiar/shared-types`
Schema: `packages/db-schema/src/schemas/image.ts`

| Field | Type | Purpose |
|-------|------|---------|
| `registerDate` | Date | Capture time |
| `device` | ObjectId → Device | Source device |
| `actuator` | ObjectId → Actuator | Capturing actuator |
| `file` | Mixed | multer file object |
| `fileName` | String | Stored filename (UUID) |

### Archive

Interface: `IArchive` in `@hushiar/shared-types`
Schema: `packages/db-schema/src/schemas/archive.ts`

| Field | Type | Purpose |
|-------|------|---------|
| `startDate` | Date | Archive period start |
| `endDate` | Date | Archive period end |
| `duration` | Number | Duration in seconds (fixed: removed duplicate field) |
| `device` | ObjectId → Device | Source device |
| `sensor` | ObjectId → Sensor | Triggering sensor |
| `isMoving` | Boolean | Motion during archive |
| `hasHighSound` | Boolean | Sound threshold |
| `hasHighTemperature` | Boolean | Temperature threshold (fixed: was `hasHighTemperture`) |
| `videoFileName` | String | Generated video filename |
| `imageList` | [ObjectId → Image] | Included frames |

### Log

Interface: `ILog` in `@hushiar/shared-types`
Schema: `packages/db-schema/src/schemas/log.ts`

| Field | Type | Purpose |
|-------|------|---------|
| `registerDate` | Date | Event time |
| `type` | String (enum) | `moving`, `imageCaptured`, `videoArchive`, `changeMode`, `addSubscriber`, `getToken` |
| `logData` | Mixed | Event payload |
| `device` | ObjectId → Device | Source device |
| `user` | ObjectId → User | (fixed: was `User` with capital U) |

### Command

Interface: `ICommand` in `@hushiar/shared-types`
Schema: `packages/db-schema/src/schemas/command.ts`

| Field | Type | Purpose |
|-------|------|---------|
| `registerDate` | Date | — |
| `type` | String | Command type |
| `data` | Mixed | Command payload |
| `isDone` | Boolean | Execution status |
| `device` | ObjectId → Device | Target device |

### Other Schemas

- **Subscriber** (`ISubscriber`) — Push notification subscription records
- **Auth** (`IAuth`) — Authentication tokens for session management
- **Verbose** (`IVerbose`) — Debug/verbose data from devices
- **DeviceType** (`IDeviceType`) — Device type catalog (fixed: `isAvaliable` → `isAvailable`)
- **Location** (`ILocation`) — Physical location metadata

## Entity Relationships

```
User
 ├── Device[] (1:many)
 │    ├── Sensor[] (1:many)
 │    ├── Actuator[] (1:many)
 │    ├── Image[] (1:many)
 │    ├── Log[] (1:many)
 │    ├── Command[] (1:many)
 │    └── Archive[] (1:many)
 │         └── Image[] (many:many via imageList)
 └── Location (many:1)
      └── Device[] (1:many)

Subscriber → User (subscription for push)
Auth → User (session token)
```

## Schema Pattern

```ts
// packages/db-schema/src/schemas/device.ts
import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { IDevice } from '@hushiar/shared-types';

export interface IDeviceDoc extends IDevice, Document {}
export interface IDeviceModel extends Model<IDeviceDoc> {}

const DeviceSchema = new Schema<IDeviceDoc, IDeviceModel>({
  registerDate: { type: Date, default: Date.now },
  manufactureId: { type: String, required: true, unique: true },
  type: { type: String, enum: ['MobileApp', 'A1', 'A2'], required: true },
  // ...
});

export const DeviceModel = mongoose.model<IDeviceDoc, IDeviceModel>('Device', DeviceSchema);
```

## InfluxDB Measurements

Written via `@hushiar/providers` InfluxDB provider, tagged by `deviceId`:

| Measurement | Field | Type | Written by |
|-------------|-------|------|------------|
| `movement` | `moving` | boolean | `LogManager.moving()` (fixed: was `movment`) |
| `captureImage` | `capturing` | boolean | `LogManager.imageCaptured()` |
| `registration` | `getToken` | boolean | `LogManager.getToken()` (fixed: was `registraion`) |
| `changeMode` | `status` | string | `LogManager.deviceStatusChanged()` |

## Redis Usage

Minimal usage via `RedisProvider` in `@hushiar/providers`:

| Operation | Purpose |
|-----------|---------|
| `set(key, value)` | Store short-lived data |
| `get(key)` | Retrieve cached data |

## File Storage

Configured via environment variables:

| Storage | Env Var | Default |
|---------|---------|---------|
| Images | `IMAGE_STORAGE_PATH` | `./storage/images/` |
| Videos | `VIDEO_STORAGE_PATH` | `./storage/video/` |

- Image filenames: UUID + extension (e.g., `a1b2c3d4.jpg`)
- Images uploaded via `multer` (HTTP) or written as binary buffer (MQTT)
- CDN URL: `https://cdn.hushiar.com/<fileName>`

## Recommended Indexes

```ts
// Device
DeviceSchema.index({ manufactureId: 1 });
DeviceSchema.index({ user: 1 });
DeviceSchema.index({ token: 1 });

// Log
LogSchema.index({ device: 1, registerDate: -1 });
LogSchema.index({ user: 1, registerDate: -1 });

// Image
ImageSchema.index({ device: 1, registerDate: -1 });

// Archive
ArchiveSchema.index({ device: 1, startDate: -1 });

// Command
CommandSchema.index({ device: 1, isDone: 1 });
```

## Fixes Applied During Migration

| Legacy Issue | Fix |
|-------------|-----|
| `temperture` → `temperature` | Field renamed in device schema |
| `remaningDays` → `remainingDays` | Field renamed in user schema |
| `hasHighTemperture` → `hasHighTemperature` | Field renamed in archive schema |
| `staus` → `status` | Field renamed in sensor + actuator schemas |
| `isAvaliable` → `isAvailable` | Field renamed in deviceType schema |
| `User.credit` defined twice | Removed duplicate, kept single field |
| `Archive.duration` defined twice | Kept Number version, dropped Date version |
| `Log.User` (capital U) → `Log.user` | Field renamed |
| `movment` → `movement` | InfluxDB measurement renamed |
| `registraion` → `registration` | InfluxDB measurement renamed |
| No indexes | Added compound indexes for common queries |
| No validation | Added `required`, `enum`, and constraints |
