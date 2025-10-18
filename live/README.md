# Live Gateway (WebSockets)

Purpose
- Real-time ingress for device events and live viewing channels.

Responsibilities
- WebSocket server for device → gateway and client → gateway
- Auth and per-connection rate limits
- Publish device events to RabbitMQ
- Broker live stream topics to clients (optional)

Protocols
- WebSockets
- Message types: motion, frame, heartbeat

Queues/Routing
- Publishes to:
  - device.{deviceId}.motion
  - device.{deviceId}.frame
- Connection-level throttling via Redis

Security
- JWT per device/client
- Rate limiting and basic flood protection