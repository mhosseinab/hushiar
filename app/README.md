# App API

Main user-facing REST API + Socket.io real-time server. Handles user authentication, device management, sensor/actuator control, image/video retrieval, SMS verification, web push, and real-time notifications via WebSocket.

## Port

`4002` (`api.app.hs`)

## Files

| File | Role |
|------|------|
| `hs_appAPI.js` | Express + Socket.io server, all route definitions (~730 lines) |
| `hs_app.manager.js` | Business logic manager (~850 lines) |
| `hs_appWS.js` | Standalone WebSocket test server (port 4012, unused in production) |

## Dependencies

- Express, body-parser, cors, socket.io
- MongoDB via IoC container (`manager/ioc.manager.js`) — all 21+ managers
- ffmpeg (imported but not directly used in routes)

## Authentication

Token-based auth via `checkAuth` middleware. Reads `token` from `req.headers.token` or `req.params.token`, looks up `Auth` model by ID, attaches `req.user`. Socket.io uses `checkSocketAuth` on `io.use()` with token from `socket.handshake.query.token`.

## REST Endpoints

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/isAlive` | None | Health check |

### Locations
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/location/getAll` | Yes | List user's locations |
| POST | `/location/add` | Yes | Add location |

### Devices
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/device/getAll` | No | List devices by location (reads `locationId` from undefined header) |
| GET | `/device/getAll_user` | Yes | List all devices for authenticated user |
| GET | `/device/get_user` | Yes | Get single device by ID |
| POST | `/device/assignLocation` | Yes | Assign device to location |
| POST | `/device/setAlarmStatus` | Yes | Toggle alarm on/off |
| POST | `/device/setIsMonitoring` | Yes | Toggle monitoring on/off |
| POST | `/device/setup` | Yes | Setup/claim device by manufactureId |
| POST | `/device/setInfo` | Yes | Update device title and location |
| POST | `/device/setStatus` | Yes | Set device status (home/silent/secure) |
| GET | `/deviceType/getAll` | Yes | List device types |

### Subscribers
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/subscriber/add` | Yes | Add SMS subscriber to device |
| POST | `/subscriber/remove` | Yes | Remove subscriber |
| GET | `/subscriber/getAll_device` | Yes | List subscribers for device |

### Actuators
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/actuator/getAll_device` | Yes | List actuators for device |
| GET | `/actuator/getImageListt` | Yes | List images by actuator (note: typo in route) |
| GET | `/actuator/getStream` | No | Download hardcoded stream.mp4 file |
| GET | `/actuator/getLastImage/:timeStamp` | Yes | Get latest image data |
| POST | `/actuator/isActive` | Yes | Toggle actuator active state |

### Sensors
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/sensor/getAll_device` | Yes | List sensors for device |
| POST | `/sensor/isActive` | Yes | Toggle sensor active state |

### Logs
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/log/getAll_device` | Yes | List logs for device |
| GET | `/log/getAll_user` | Yes | List logs for user |

### Archives
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/archive/getAll_device` | Yes | List archives for device |
| GET | `/archive/getAll_user` | Yes | List archives for user |
| GET | `/archive/getOne` | Yes | Get single archive |
| POST | `/archive/delete` | Yes | Delete archive |

### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/user/get` | Yes | Get authenticated user |
| POST | `/user/signup` | No | Register with mobile number + title |
| POST | `/user/updateInfo` | Yes | Update title and email |
| POST | `/user/signinWithMobileNumber` | No | Send SMS verification code |
| POST | `/user/checkCodeWithMobileNumber` | No | Verify SMS code, return auth token |
| POST | `/user/subscribeWebPush` | Yes | Subscribe to web push notifications |
| POST | `/user/increaseCredit` | Yes | Payment/credit increase |

### Images
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/image/getAll_device` | Yes | List images for device by date |
| POST | `/image/delete` | Yes | Delete image |
| GET | `/image/get` | Yes | Get image content (base64) |

### Videos
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/video/:token/:archiveId` | Yes | Serve archive video file |
| GET | `/video/getAll_device` | Yes | List videos for device |

### Internal (no auth)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/internal/notifyUser` | None | Push alarm notification to user via socket |
| POST | `/internal/newImage` | None | Push new image notification via socket |
| POST | `/internal/newLog` | None | Push new log notification via socket |

### Debug
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/socket/getAll` | No | List connected socket users |

## Socket.io Events

Real-time events pushed from the manager to connected clients:
- **Alarm notification** — device alarm state change
- **New image** — image captured, sent as base64
- **New log** — log entry created

## Notable

- `hs_appWS.js` is a separate test server on port 4012 that only logs connections — not used in production.
- The manager (`hs_app.manager.js`) directly instantiates the IoC container and handles both REST logic and Socket.io relay.
- Several typos in the codebase: `singup`, `setDeviceSatus`, `prcosseHomeStatus`, `setActuatorIsAvtive`, `getImageListt`.
