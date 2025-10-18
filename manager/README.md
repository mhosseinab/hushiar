# Manager (Orchestrator)

Purpose
- Background orchestration and scheduled tasks.

Responsibilities
- Periodic cleanup (expired jobs, old sessions)
- Telemetry rollups/summaries to Mongo
- Retry stuck video jobs
- DLQ reprocessing with safeguards

Schedules
- cron: rollups every 5 min
- cron: cleanup daily
- job: requeue DLQ with max attempts and alerts

Dependencies
- RabbitMQ (DLQ access)
- MongoDB (jobs)
- InfluxDB (rollups)
- Redis (locks)