# Providers (Pluggable Interfaces)

Purpose
- Abstractions for broker, storage, push notifications, and metrics.

Providers
- broker/
  - interface: publish(topic, msg, opts), subscribe(queue, handler, opts)
  - impl: RabbitMQ
- storage/
  - interface: putFrame(path, buffer), getFrame(path), listFrames(prefix)
  - impl: local FS, S3
- push/
  - interface: send(to, title, body, data)
  - impl: Firebase
- metrics/ (optional)
  - interface: counter, histogram
  - impl: Prometheus

Design
- Dependency inversion to allow swapping implementations
- Centralized configuration and error handling