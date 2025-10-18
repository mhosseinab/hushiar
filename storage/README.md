# Storage Layer

Purpose
- Handling frames and artifacts storage.

Layout
- frames/{deviceId}/{yyyy}/{mm}/{dd}/{HH}/{timestamp}.jpg
- videos/{jobId}.mp4

Interfaces
- putFrame(path, buf)
- getFrame(path)
- getSignedUrl(path, ttl)
- writeVideo(jobId, stream)

Backends
- FS: local development
- S3: production-ready with signed URLs

Retention
- Frames: N days
- Videos: M days (configurable)