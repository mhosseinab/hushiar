# Admin Service

Purpose
- Management and query APIs for devices, users/subscriptions, alerts, and video jobs.
- Control plane for triggering on-demand video assembly.

Responsibilities
- Device lifecycle: register, enable/disable, rotate credentials.
- User/subscription management (notification tokens).
- Query alerts, telemetry summaries, video job statuses.
- Trigger/monitor video assembly jobs.

APIs (HTTP/REST)
- POST /devices
- PATCH /devices/:id
- GET /devices/:id
- GET /alerts?deviceId=&from=&to=
- POST /video-jobs
- GET /video-jobs/:id

Events Published (RabbitMQ)
- jobs.video.create
- device.credentials.rotate

Dependencies
- MongoDB: devices, alerts, video_jobs
- Redis: short-lived state
- RabbitMQ: publish job/events
- Storage: frames/artifacts (read)
- InfluxDB: read telemetry rollups (optional)

Security
- JWT for admin/client calls, role checks
- Input validation with schemas