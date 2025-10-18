# Subscribers (Message Consumers)

Purpose
- RabbitMQ consumers that handle event streams.

Consumers
- motion.events.consumer
- frame.events.consumer
- alert.evaluate.consumer
- video.jobs.consumer

Patterns
- Prefetch control
- Idempotency keys
- Retry + DLQ
- Message-level logging with traceId

Error Handling
- Retry policy: exponential backoff with max attempts
- DLQ queues: *.dlq
- Poison pill detection and quarantine