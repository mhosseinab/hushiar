# Providers (External Service Adapters)

Thin wrappers around external services. All use the constructor-function module pattern with dependency injection.

## Files

| File | Service | Methods | Notes |
|------|---------|---------|-------|
| `hushyaarMqtt.prvd.js` | Hushiar MQTT broker | `subscribeToTopic`, `subscribeToTopicList`, `unsubscribeToTopic`, `publish`, `setSubscribtionCallBackFunction` | Note: filename has typo — should be `hushiarMqtt` |
| `hivemq.prvd.js` | HiveMQ MQTT broker | Same as above | Public broker (`broker.hivemq.com`) |
| `emqx.prvd.js` | EMQX MQTT broker | Same as above | Public broker (`broker.emqx.io`) |
| `redis.prvd.js` | Redis | `set`, `get` | Uses redis@3 callback API |
| `influx.prvd.js` | InfluxDB Cloud | `write`, `writeBoolean`, `writeString` | Cloud InfluxDB (eu-central-1-1) |
| `kavenegar.prvd.js` | Kavenegar SMS | `sendSMS`, `sendTemplatedSMS` | Iran-based SMS gateway |
| `ga.prvd.js` | (empty) | — | Empty file, no implementation |

## MQTT Providers

Three near-identical MQTT wrapper implementations sharing the same interface:

```
subscribeToTopic(topic)       → Promise
subscribeToTopicList(topics)  → Promise.all
unsubscribeToTopic(topic)     → Promise (bug: calls subscribe instead of unsubscribe)
publish(topic, value)         → void
setSubscribtionCallBackFunction(fn) → sets callback for incoming messages
```

Each wraps an `mqtt.Client` instance (passed via options) and registers event handlers on construction (connect, close, disconnect, offline, error, message).

### Bug

`unsubscribeToTopic()` in all three MQTT providers calls `mqttClient.subscribe()` instead of `mqttClient.unsubscribe()`.

## Redis Provider

Simple key-value wrapper using redis@3 callback-style API:

```js
set(key, value) → Promise
get(key)        → Promise
```

## InfluxDB Provider

Writes data points to InfluxDB Cloud:

```js
write(point)                          → Promise
writeBoolean(measurement, deviceId, field, value) → Promise
writeString(measurement, deviceId, field, value)  → Promise
```

Each `write` call creates a new write API, writes a single point, and closes. Token/org/bucket are hardcoded as empty strings.

## Kavenegar Provider

SMS delivery via Kavenegar API:

```js
sendSMS(sender, receptor, message)                          → Promise
sendTemplatedSMS(template, receptor, token, token2, token3) → Promise
```

## Notable

- `ga.prvd.js` is completely empty — appears to be a planned Google Analytics provider that was never implemented.
- No RabbitMQ, S3, Firebase, or Prometheus providers exist.
- The three MQTT providers are copy-paste identical except for log messages and `hivemq.prvd.js` has a slightly different `publish()` signature.
- All credentials are empty strings hardcoded in `ioc.manager.js`.
