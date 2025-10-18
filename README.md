# Hushiar — Real-time Home Surveillance (IoT, Event-Driven)

Hushiar is a real-time home surveillance platform that ingests motion and camera events from edge devices, processes and stores telemetry, sends instant alerts, and can assemble short video clips on demand. The system is built as an event-driven architecture optimized for low-latency alerting and scalable ingestion.

- Live monitoring via WebSockets
- Motion detection pipeline with buffering/thresholds
- Push notifications on alert
- On-demand video assembly from captured frames
- Time-series telemetry and searchable metadata
- Modular providers for storage, push, and broker

Status: MVP demo. Repo history was purged for security/privacy.

## Table of Contents
- Architecture Overview
- Core Capabilities
- Technologies
- Services and Folders
- Data Flows
- Event-Driven Design
- Storage Strategy
- Observability and Operations
- Security and Hardening
- Local Development
- Configuration
- Testing and Benchmarks
- Roadmap
- ADRs (Architecture Decision Records)
- License

## Architecture Overview

Hushiar follows an event-driven microservices style with a message broker (RabbitMQ) at its core. Edge devices send motion/camera events via WebSockets to the Gateway. Events are published to RabbitMQ and processed by a Node.js event processor. Telemetry is stored in InfluxDB (time-series), metadata in MongoDB, cached/rate-limited in Redis, and alerts are delivered via Firebase Cloud Messaging (FCM). Frames are persisted to a storage provider, and a video assembler service can stitch them into short clips.

## Core Capabilities

- Real-time event ingestion from devices (motion/camera)
- Low-latency alerting via push notifications
- Time-series telemetry (motion intensity, counts, device health)
- Metadata and device/account management
- Live streaming channel via WebSockets
- On-demand video clip assembly from stored frames
- Pluggable providers for messaging, storage, and notifications

## Technologies

- Runtime: Node.js
- Messaging: RabbitMQ (routing keys, DLQs, retries)
- Datastores:
  - InfluxDB (time-series telemetry)
  - MongoDB (metadata, entities, jobs)
  - Redis (caching, rate limiting, short-lived state)
- Realtime: WebSockets (live monitoring, device channel)
- Notifications: Firebase Cloud Messaging (FCM)
- Supporting:
  - PM2 (ecosystem.config.js) for process management (optional)
  - Docker/Docker Compose for local dev (recommended)
  - ESLint/Jest (recommended for CI)
  - Grafana/Prometheus or ELK (recommended for observability)

## Services and Folders

- admin/ — Admin and management APIs (device registration, user management, querying metadata, triggering video assembly)
- app/ — Application bootstrap, shared config and setup
- device/ — Device-related handlers (auth, registration, device state)
- live/ — Live WebSocket gateway for device/client connections
- manager/ — Orchestration tasks, schedules, and job control
- model/ — Data models and schemas (MongoDB/InfluxDB)
- provider/ — Pluggable providers (push notifications, storage, broker)
- service/ — Core domain services (event processing, alerting, stitching)
- storage/ — Frame/file storage implementations and helpers
- subscriber/ — Message queue consumers/subscribers (event handlers)

Note: Each folder should contain a README with scope and interfaces (recommended).

## Data Flows

1) Motion/Camera Ingestion
- Device detects motion and optionally captures frames
- Device sends event via WebSocket to Gateway
- Gateway validates/authenticates and publishes event to RabbitMQ with appropriate routing key
- Event Processor consumes from queue, performs:
  - Dedup/rate limiting using Redis
  - Writes telemetry to InfluxDB
  - Writes event/metadata to MongoDB
  - Persists frames to storage
  - Triggers conditional alert via FCM

2) Alert Delivery
- Threshold rules evaluate recent motion events (sliding window)
- If alert triggers:
  - Event Processor sends FCM push to subscribed clients
  - Alert document recorded in MongoDB

3) On-demand Video Assembly
- Client requests a clip for timeframe [t0, t1]
- Admin/Manager API creates a job in MongoDB
- Video Assembler pulls frames from storage and stitches
- On completion, generates a downloadable URL or stores artifact
- Job status updated in MongoDB

## Event-Driven Design

- Contracts
  - Routing keys: device.{deviceId}.motion, device.{deviceId}.frame, alerts.trigger, jobs.video.create
  - Message payloads include deviceId, timestamps, type, and references to frames/segments
- Queues
  - motion.events, frame.events, alert.evaluate, video.jobs
- Delivery semantics
  - At-least-once consumption with idempotency keys
  - Dead-letter queues for poison messages (e.g., *.dlq)
  - Retry policies with exponential backoff
- Backpressure
  - Rate limiting via Redis counters
  - Consumer concurrency tuned via prefetch
- Ordering
  - Per-device ordering approximated via partitioned routing keys
- Extensibility
  - Providers pattern for swapping push, storage, or broker backends

## Storage Strategy

- Time-Series (InfluxDB)
  - motion_intensity, motion_count, device_health
  - Retention policies per environment (e.g., 30–90 days)
- Metadata (MongoDB)
  - devices, alerts, video_jobs, users/subscriptions
- Cache (Redis)
  - rate limits, dedup keys, short-lived coordination
- Frames (Object storage or FS)
  - Organized by deviceId/date/hour
  - S3 or local FS backend; signed URL generation for clients
- Indexing
  - MongoDB indexes on deviceId + time, job status, alert time
  - InfluxDB measurements tagged by deviceId

## Observability and Operations

- Metrics (recommended Prometheus + Grafana)
  - Ingestion p50/p95 latency (device → alert)
  - Broker lag, consumer throughput, retry counts
  - Video assembly timings (median/p95)
  - Error rates per stage
- Logging (structured JSON)
  - Trace IDs per message
  - DeviceId and jobId included for correlation
- Tracing (optional, OpenTelemetry)
  - Spans: gateway publish → consume → process → notify → persist
- SLOs (suggested)
  - Alert p95 latency: ≤ 200 ms at 250 eps
  - Video assembly median (10s clip): ≤ 3.5 s
  - Change failure rate: < 10%
- Runbooks
  - Incident handling for broker backlog, DLQ spikes, storage saturation
  - “Re-drain DLQ” playbook with safety checks

## Security and Hardening

- Device auth
  - Tokens per device (JWT) or mTLS (future)
- Rate limiting and quotas per device/account
- Input validation and schema contracts for messages
- Secrets management via environment variables or vault
- Least-privilege IAM for storage and messaging backends
- PII handling and data retention windows
- Signed URLs for retrieving video artifacts

## Roadmap

- Device control/telemetry gRPC APIs (buf-managed, versioned)
- OpenTelemetry tracing, Prometheus metrics exporters
- mTLS device auth and key rotation
- Multi-tenant RBAC and org scoping
- Adaptive bitrate live streaming
- Pluggable message brokers (NATS, Pulsar) via provider interface
- Edge buffering and offline sync

## License

Proprietary — temporary public demo for evaluation. Contact maintainers for usage terms.

Folder Docs
- [admin](admin/README.md) — Admin/management APIs
- [app](app/README.md) — Bootstrap/config/shared modules
- [device](device/README.md) — Device domain and validation
- [live](live/README.md) — WebSocket ingress and live channels
- [manager](manager/README.md) — Orchestration and scheduled tasks
- [model](model/README.md) — Schemas/models
- [provider](provider/README.md) — Pluggable providers
- [service](service/README.md) — Core business logic (events, alerts, video)
- [storage](storage/README.md) — Frames/artifact storage
- [subscriber](subscriber/README.md) — RabbitMQ consumers