# Subscriber API (Stub / Placeholder)

Stub service that was never fully implemented. The manager file is 0 bytes (empty) and the API file is a partial fragment with no routes or listen call.

## Port

`4002` (`api.subscriber.hs`) — defined but server never started

## Files

| File | Role |
|------|------|
| `hs_subscriberApi.js` | Incomplete fragment — defines Express + Socket.io setup but has no routes and never calls `http.listen()` |
| `hs_subscriber.manager.js` | Empty file (0 bytes) |

## What Exists

`hs_subscriberApi.js` contains only the setup boilerplate:

```js
const API_PORT = 4002;
const PACKAGE_NAME = 'api.subscriber.hs';
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http, { ... });
```

No routes, no middleware, no `http.listen()`, no manager initialization.

## Not Implemented

- No RabbitMQ consumers
- No message processing
- No retry logic or DLQ
- No event handlers
- No Socket.io event handlers
- No business logic of any kind

## Port Conflict

Port `4002` is the same port used by the `app/` service (`api.app.hs`), which suggests this service was abandoned early and its planned functionality was absorbed into `app/`.

## Notable

- The subscriber *model* (`model/subscriber.model.js`) and subscriber *manager* (`manager/subscriber.manager.js`) both exist and are functional — they're used by the `app/` service. Only this standalone subscriber API service was never completed.
