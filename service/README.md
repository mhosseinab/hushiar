# Service (Cron Scheduler)

Node-schedule cron jobs for periodic background tasks. This is the only scheduling/orchestration module — not event processing, alerting, or video assembly as separate services.

## Files

| File | Role |
|------|------|
| `service.js` | Cron scheduler with 3 scheduled jobs |

## Dependencies

- `node-schedule` — cron-style job scheduling
- `fast-folder-size` — calculate folder sizes
- `fs` — filesystem operations
- IoC container (`manager/ioc.manager.js`) — access to all managers

## Scheduled Jobs

### 1. `archiveImages` — Video Archive Generation

| Property | Value |
|----------|-------|
| Schedule | `*/${ARCHIVE_VIEDO_DURATION_MIN} * * * *` (every 1 minute) |
| Purpose | Convert device images into video archives |

Process:
1. Get all devices from DB
2. For each device, fetch images within the last `ARCHIVE_VIEDO_DURATION_MIN` minutes
3. If images exist, generate a video via `videoshow`/ffmpeg
4. Create an `Archive` record in MongoDB
5. Create a `Log` entry for the archived video
6. Notify user via Socket.io

### 2. `updateUserListRemaningDays` — Daily Credit Decrement

| Property | Value |
|----------|-------|
| Schedule | Daily at 10:50 AM |
| Purpose | Decrement each user's remaining days by 1 |

Process:
1. Get all users
2. Call `user.updateRemainingDays(userId, -1)` for each user

### 3. `updateUserListStorageInfo` — Storage Usage Monitor

| Property | Value |
|----------|-------|
| Schedule | `*/${ARCHIVE_VIEDO_DURATION_MIN} * * * *` (every 1 minute) |
| Purpose | Calculate and update storage usage per user |

Process:
1. Get all users
2. Calculate total storage used (images + videos) via `fast-folder-size`
3. If user has no `storageMaxSize`, set default to 200 MB
4. Update `storageUsedSize` and `storageRemainedSize` on user document

## Notable

- The archive and storage monitor jobs share the same cron interval as `ARCHIVE_VIEDO_DURATION_MIN` (1 minute), meaning the cron expression is duplicated for two different purposes.
- `ARCHIVE_VIEDO_DURATION_MIN` has a typo: "VIEDO" instead of "VIDEO".
- Variable name `remaningDaysScheduleRule` has a typo: "remaning" instead of "remaining".
- The service creates its own IoC container instance (separate from the API services).
- No error recovery — failed archive generation is logged but not retried.
