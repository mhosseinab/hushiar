# Device Domain

Purpose
- Device registration, credentials, and device-side message validation.

Responsibilities
- Register devices, assign keys/tokens
- Validate device-originated messages (auth/signature)
- Track device state/health/last-seen

APIs
- Called by Admin service for lifecycle
- Provides helper: validateDeviceEvent(payload, signature)

Events Consumed/Published
- Consumes: device.credentials.rotate
- Publishes: device.state.updated

Models
- Device: {id, name, status, keys, lastSeen, ownerId}