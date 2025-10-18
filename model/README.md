# Models and Schemas

Purpose
- Data model definitions and schema validation.

Contents
- MongoDB schemas: Device, Alert, VideoJob, User
- InfluxDB measurements: motion_intensity, motion_count, device_health
- Validation schemas (e.g., zod/joi) for inbound events

Guidelines
- Keep persistence code here (CRUD, indexes)
- Provide typed interfaces/DTOs