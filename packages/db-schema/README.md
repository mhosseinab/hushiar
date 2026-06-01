# @hushiar/db-schema

Mongoose 8 schemas, typed models, and the MongoDB connection helper. All other packages and apps import models from here — never from `mongoose` directly.

---

## Table of Contents

- [Usage](#usage)
- [Schema Catalogue](#schema-catalogue)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Field-Level Notes](#field-level-notes)
- [Connection Management](#connection-management)

---

## Usage

```typescript
import { connect, disconnect } from '@hushiar/db-schema';
import { UserModel, DeviceModel, ImageModel } from '@hushiar/db-schema';

await connect(); // reads MONGO_URI from process.env
```

Each exported model is typed with an `IDoc` interface (the document shape from `@hushiar/shared-types`) and an `IModel` interface (adding static query helpers where needed).

---

## Schema Catalogue

| Export | Collection | Source interface |
|--------|------------|-----------------|
| `UserModel` | `users` | `IUser` |
| `DeviceModel` | `devices` | `IDevice` |
| `LocationModel` | `locations` | `ILocation` |
| `SensorModel` | `sensors` | `ISensor` |
| `ActuatorModel` | `actuators` | `IActuator` |
| `ImageModel` | `images` | `IImage` |
| `ArchiveModel` | `archives` | `IArchive` |
| `LogModel` | `logs` | `ILog` |
| `CommandModel` | `commands` | `ICommand` |
| `AuthModel` | `auths` | `IAuth` |
| `DeviceTypeModel` | `devicetypes` | `IDeviceType` |
| `SubscriberModel` | `subscribers` | `ISubscriber` |
| `VerboseModel` | `verboses` | `IVerbose` |
| `StorageModel` | `storages` | `IStorage` |

---

## Entity Relationship Diagram

```mermaid
erDiagram
    USER {
        ObjectId _id
        string title
        string mobileNumber
        string email
        number credit
        number remainingDays
        number storageUsedSize
        number storageRemainedSize
        number storageMaxSize
        Date lastSMSDateTime
        Date lastWPDateTime
        array wpSubList
        Date registerDate
    }

    LOCATION {
        ObjectId _id
        string title
        string address
        ObjectId user
        Date registerDate
    }

    DEVICE {
        ObjectId _id
        string title
        string manufactureId
        string type
        string token
        string mqttUserName
        string mqttPassword
        number temperature
        string status
        boolean isOn
        boolean isOnAlarm
        boolean isMoving
        boolean isMonitoring
        boolean isLightOn
        ObjectId user
        ObjectId location
        Date registerDate
    }

    SENSOR {
        ObjectId _id
        string type
        ObjectId device
        boolean isActive
        string status
        string manufactureId
    }

    ACTUATOR {
        ObjectId _id
        string type
        ObjectId device
        boolean isActive
        string status
        string manufactureId
    }

    IMAGE {
        ObjectId _id
        string fileName
        ObjectId device
        ObjectId actuator
        Date registerDate
    }

    ARCHIVE {
        ObjectId _id
        ObjectId device
        ObjectId sensor
        Date startDate
        Date endDate
        string videoFileName
        array imageList
        number duration
        boolean isMoving
        boolean hasHighSound
        boolean hasHighTemperature
    }

    LOG {
        ObjectId _id
        string type
        Mixed logData
        ObjectId device
        ObjectId user
        Date registerDate
    }

    COMMAND {
        ObjectId _id
        ObjectId device
        ObjectId actuator
        ObjectId sensor
        string command
        array logData
        Date fetchDate
        boolean isDone
        Date registerDate
    }

    AUTH {
        ObjectId _id
        string authToken
        ObjectId user
        ObjectId subscriber
        Date createDate
        Date enterDate
    }

    SUBSCRIBER {
        ObjectId _id
        ObjectId device
        string title
        string mobileNumber
        Date accessEndDate
        Date registerDate
    }

    DEVICETYPE {
        ObjectId _id
        string title
        number price
        number payablePrice
        string description
        string headImage
        array imageList
        boolean isAvailable
    }

    STORAGE {
        ObjectId _id
        ObjectId user
        number usedSize
        number maxSize
        Date registerDate
    }

    USER ||--o{ DEVICE : "owns"
    USER ||--o{ LOCATION : "has"
    USER ||--o{ AUTH : "has"
    USER ||--o{ STORAGE : "has"

    DEVICE }o--o| LOCATION : "at"
    DEVICE ||--o{ SENSOR : "has"
    DEVICE ||--o{ ACTUATOR : "has"
    DEVICE ||--o{ IMAGE : "captures"
    DEVICE ||--o{ ARCHIVE : "archives"
    DEVICE ||--o{ LOG : "generates"
    DEVICE ||--o{ COMMAND : "receives"
    DEVICE ||--o{ SUBSCRIBER : "notifies"

    IMAGE }o--|| ACTUATOR : "captured by"
    IMAGE }o--o{ ARCHIVE : "included in"

    AUTH }o--o| SUBSCRIBER : "subscriber auth"
```

---

## Field-Level Notes

### Typo corrections from legacy code

All field names below were renamed during the TypeScript migration. The old names are **not** in the schemas — if you see them in old client code, update the client.

| Legacy (wrong) | Corrected | Schema |
|---------------|-----------|--------|
| `remaningDays` | `remainingDays` | `users` |
| `temperture` | `temperature` | `devices` |
| `staus` (×2) | `status` | `sensors`, `actuators` |
| `hasHighTemperture` | `hasHighTemperature` | `archives` |
| `isAvaliable` | `isAvailable` | `devicetypes` |

### `devices.mqttPassword`

Stored AES-256-CBC encrypted. The encryption key is `MQTT_PASSWORD_ENCRYPTION_KEY`. Never store or log the plaintext value. Decryption happens inside `DeviceManager.decryptMqttPassword()`.

### `devices.status`

Three conventional alarm modes (these are **not** enforced by the schema — `status` is a plain `String` with no `enum` constraint):

| Value | Meaning |
|-------|---------|
| `'home'` | Alarm disarmed — motion events are not logged |
| `'silentMonitoring'` | Silent monitoring — device records without audible alerts |
| `'secureMonitoring'` | Secure monitoring — full alarm with alerts and logs |

### `auths.subscriber` / `auths.enterDate`

Optional fields. Auth records created for regular users do not set these — only subscriber auth records do.

### `archives.imageList`

Array of `ObjectId` references to `images`. The image documents are **not** deleted when an archive is created — they remain queryable individually.

---

## Connection Management

```typescript
// src/connection.ts
import mongoose from 'mongoose';

export async function connect(): Promise<void> {
  await mongoose.connect(process.env['MONGO_URI'] ?? 'mongodb://localhost:27017/hushiar');
}

export async function disconnect(): Promise<void> {
  await mongoose.disconnect();
}
```

`connect()` is called once at app startup. Each app registers a `SIGTERM` handler that calls `mongoose.disconnect()` before `process.exit(0)`.
