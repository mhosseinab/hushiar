# Domain Services

Purpose
- Core business logic for event processing, alert evaluation, and video assembly.

Services
- event-processor/
  - Consume motion/frame events
  - Dedup and rate limit (Redis)
  - Persist telemetry (Influx), metadata (Mongo)
  - Persist frames (Storage)
  - Evaluate alert thresholds; publish alert events
- alerting/
  - Build and send FCM notifications
  - Record alert documents
- video-assembler/
  - Build video clips from frames in a time window
  - Update job status and store artifact/URL

Queues
- motion.events, frame.events → event-processor
- alert.evaluate → alerting
- video.jobs → video-assembler

SLOs (targets)
- Alert p95 ≤ 200 ms @ 250 eps
- 10s clip median ≤ 3.5 s