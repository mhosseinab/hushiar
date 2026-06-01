# Models (Mongoose Schemas)

14 Mongoose schema files + database connection module. All schemas use plain `mongoose.Schema` with no TypeScript, no validation, no indexes defined in code.

## Files

| File | Mongoose Model | Key Fields |
|------|---------------|------------|
| `db.js` | — | MongoDB connection (`mongoose.connect`) |
| `device.model.js` | `Device` | title, manufactureId, type, status, isOn, isMonitoring, isOnAlarm, isMoving, isLightOn, temperture, user (ref), location (ref), token, mqttUserName, mqttPassword |
| `deviceType.model.js` | `DeviceType` | — |
| `user.model.js` | `User` | title, mobileNumber, email, isValid, credit, wpSubList, isMobileNumberConfirmed, lastWPDateTime, lastSMSDateTime, storageMaxSize, storageUsedSize, storageRemainedSize, remaningDays |
| `sensor.model.js` | `Sensor` | — |
| `actuator.model.js` | `Actuator` | — |
| `log.model.js` | `Log` | — |
| `command.model.js` | `Command` | — |
| `subscriber.model.js` | `Subscriber` | — |
| `location.model.js` | `Location` | — |
| `image.model.js` | `Image` | registerDate, device (ref), actuator (ref), file (Mixed), fileName |
| `archive.model.js` | `Archive` | — |
| `auth.model.js` | `Auth` | — |
| `verbose.model.js` | `Verbose` | — |
| `storage.model.js` | `Storage` | Empty schema (no fields defined) |

## Database Connection (`db.js`)

```js
mongoose.connect(awsConnection, callback);
```

Connects to MongoDB at `localhost:27017/homeSecurity` (the `awsConnection` variable is an empty string, so it falls back to the `localConnection` variable that is defined but unused — the actual connection uses `awsConnection`).

## Pattern

Each model file follows the same pattern:

```js
var mongoose = require('mongoose');
var XxxSchema = new mongoose.Schema({ ... });
module.exports = mongoose.model('Xxx', XxxSchema);
```

No typed interfaces, no validation middleware, no enum constraints, no default values, no index definitions.

## Notable

- `storage.model.js` exports a model with an empty schema — never used.
- Schema has typo: `temperture` instead of `temperature` in `device.model.js`.
- Schema has typo: `remaningDays` instead of `remainingDays` in `user.model.js`.
- No Alert or VideoJob models exist — these were aspirational/planned.
- No InfluxDB measurement definitions exist here.
- The `db.js` connection has no error handling beyond a console.log.
