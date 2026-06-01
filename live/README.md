# Live API (Stub)

Stub service — never fully implemented. Creates an Express server with only a health check endpoint and an empty manager. The actual real-time Socket.io relay runs inside the `app/` service.

## Port

`4005` (`api.live.hs`)

## Files

| File | Role |
|------|------|
| `hs_liveAPI.js` | Express server with single `/isAlive` route |
| `hs_live.manager.js` | Empty constructor function (3 lines) |

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/isAlive` | None | Health check |

## Not Implemented

- No WebSocket / Socket.io server
- No authentication middleware (defined but unused — `checkAuth` function exists in the API file but no routes call it)
- No Redis, no message queues
- No real-time functionality — all of that lives in `app/hs_appAPI.js`

## Notable

- The `checkAuth` function is defined in `hs_liveAPI.js` but never used by any route.
- This service appears to have been planned as the real-time gateway but the actual implementation was done in `app/` instead.
