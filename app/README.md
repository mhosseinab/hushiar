# App Bootstrap

Purpose
- Application bootstrap, configuration loading, DI container wiring, shared utilities.

Responsibilities
- Load .env/config
- Initialize connections (Mongo, Redis, RabbitMQ, Influx)
- Register global middlewares/logging
- Provide shared modules (logger, config, metrics)

Exports
- getConfig(), getLogger(), getConnections()
- healthCheck()

Dependencies
- Configuration files, env vars

Notes
- Keep pure and framework-agnostic where possible.
- Central point to standardize telemetry and logging.