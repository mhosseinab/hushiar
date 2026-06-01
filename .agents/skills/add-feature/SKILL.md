---
name: add-feature
description: Step-by-step guide for adding a new feature to the Hushiar system — whether it's a new API endpoint, a new manager method, a new model, or a new MQTT topic handler. Load this skill when you need to extend the system with new functionality.
---

# Hushiar — Adding a New Feature

## Touch Points for Common Tasks

| Task | shared-types | db-schema | providers | core | app |
|------|-------------|-----------|-----------|------|-----|
| New entity type | ✅ Add interface | ✅ Add schema | — | ✅ Add manager | — |
| New API endpoint | ✅ Add DTO | — | — | If new logic | ✅ Add route |
| New business logic | — | — | — | ✅ Add method | ✅ Call it |
| New external service | ✅ Add types | — | ✅ Add provider | ✅ Inject | — |
| New scheduled job | — | — | — | ✅ Add method | ✅ app-api scheduler |
| New MQTT topic | ✅ Add constants | — | — | ✅ mqtt manager | — |
| New schema field | ✅ Update interface | ✅ Update schema | — | ✅ Update queries | ✅ Update route |

## Step-by-Step Recipes

### Recipe 1: Add a New API Endpoint

1. **Define request/response types** in `packages/shared-types/src/dto/`:

```ts
// packages/shared-types/src/dto/feature.ts
import { z } from 'zod';

export const newFeatureRequestSchema = z.object({
  param: z.string(),
  value: z.number().positive(),
});

export type NewFeatureRequest = z.infer<typeof newFeatureRequestSchema>;

export interface NewFeatureResponse {
  result: string;
}
```

2. **Add the route** in the target app:

```ts
// apps/device-api/src/routes/feature.ts
import { Router } from 'express';
import { z } from 'zod';
import type { IFeatureManager } from '@hushiar/core';
import { newFeatureRequestSchema } from '@hushiar/shared-types';

export function createFeatureRoutes(featureManager: IFeatureManager): Router {
  const router = Router();

  router.post('/feature/action', async (req, res, next) => {
    try {
      const parsed = newFeatureRequestSchema.parse(req.body);
      const result = await featureManager.doSomething(parsed);
      res.json({ result });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
```

3. **Mount in app entry point:**

```ts
// apps/device-api/src/index.ts
import { createFeatureRoutes } from './routes/feature.js';
// ...
app.use(createFeatureRoutes(featureManager));
```

4. **Add manager method** in `packages/core/`
5. **Test:** `pnpm turbo run dev --filter=@hushiar/device-api`

### Recipe 2: Add a New Entity (Model + Manager)

1. **Define the interface** in `packages/shared-types/src/entities/`:

```ts
// packages/shared-types/src/entities/feature.ts
export interface IFeature {
  id: string;
  registerDate: Date;
  name: string;
  deviceId: string;
  config: Record<string, unknown>;
}
```

Export from `packages/shared-types/src/entities/index.ts`.

2. **Create the schema** in `packages/db-schema/src/schemas/`:

```ts
// packages/db-schema/src/schemas/feature.ts
import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { IFeature } from '@hushiar/shared-types';

export interface IFeatureDoc extends IFeature, Document {}
export interface IFeatureModel extends Model<IFeatureDoc> {}

const FeatureSchema = new Schema<IFeatureDoc, IFeatureModel>({
  registerDate: { type: Date, default: Date.now },
  name: { type: String, required: true },
  device: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
  config: { type: Schema.Types.Mixed, default: {} },
});

export const FeatureModel = mongoose.model<IFeatureDoc, IFeatureModel>('Feature', FeatureSchema);
```

3. **Create the manager** in `packages/core/src/managers/`:

```ts
// packages/core/src/managers/feature/index.ts
import type { IFeatureModel } from '@hushiar/db-schema';
import type { IFeature, IFeaturePopulated } from '@hushiar/shared-types';

export class FeatureManager {
  constructor(private readonly featureModel: IFeatureModel) {}

  async add(name: string, deviceId: string): Promise<IFeature> {
    return this.featureModel.create({ name, device: deviceId });
  }

  async getAll(): Promise<IFeaturePopulated[]> {
    return this.featureModel.find({}).populate('device');
  }
}
```

4. **Export from core:**

```ts
// packages/core/src/index.ts
export { FeatureManager } from './managers/feature/index.js';
```

5. **Use in apps** — each app imports and wires only what it needs:

```ts
import { FeatureManager } from '@hushiar/core';
import { FeatureModel } from '@hushiar/db-schema';

const featureManager = new FeatureManager(FeatureModel);
```

### Recipe 3: Add a New MQTT Topic Handler

1. **Define topic constant** in `packages/shared-types/src/events/mqtt.ts`:

```ts
export const MQTT_TOPICS = {
  // ... existing
  NEW_SENSOR: 'NewSensor',
} as const;
```

2. **Add topic parsing** in `packages/core/src/managers/mqtt/`:

```ts
// In translateTopic():
else if (type === MQTT_TOPICS.NEW_SENSOR) {
  result.method = 'newSensor';
  result.type = 'NewSensor';
}
```

3. **Add handling in message dispatcher:**

```ts
else if (translatedTopic.method === 'newSensor') {
  if (newSensorCallback) {
    newSensorCallback(translatedTopic, message === '0' ? false : true);
  }
}
```

4. **Register callback** in the consuming app or manager

### Recipe 4: Add a Scheduled Job

1. **Add the job method** in the appropriate manager in `packages/core/`
2. **Create the job** in `apps/app-api/src/scheduler.ts`:

```ts
import { Cron } from 'croner';

const job = new Cron('*/5 * * * *', async () => {
  await someManager.runScheduledTask();
});
```

### Recipe 5: Add a New External Service Provider

1. **Define types** in `packages/shared-types/`
2. **Create provider** in `packages/providers/src/`:

```ts
// packages/providers/src/new-service.ts
export class NewServiceProvider {
  private client: NewServiceClient;

  constructor(config: NewServiceConfig) {
    this.client = createClient(config);
  }

  async doSomething(param: string): Promise<Result> {
    return this.client.action(param);
  }
}
```

3. **Export from providers:**

```ts
// packages/providers/src/index.ts
export { NewServiceProvider } from './new-service.js';
```

4. **Inject into manager** in `packages/core/` via constructor
5. **Wire in app** — pass configured provider to manager constructor

## Common Patterns

### Validation Middleware

Every POST/PUT route should validate input with zod:

```ts
// apps/<name>/src/middleware/validate.ts
import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@hushiar/shared-types';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new ValidationError(err.message));
      }
      next(err);
    }
  };
}
```

### Manager Interface Pattern

Define manager interfaces in `shared-types` for inversion of control:

```ts
// packages/shared-types/src/managers/device.ts
export interface IDeviceManager {
  getAll(): Promise<IDevicePopulated[]>;
  getByManufactureId(id: string): Promise<IDevicePopulated | null>;
  setOnAlarm(manufactureId: string, isOnAlarm: boolean): Promise<IDevice>;
  registerDeviceToken(manufactureId: string): Promise<DeviceRegistration>;
}
```

## Common Pitfalls

- **Forgetting to export from package `index.ts`** — other packages can't import it
- **Adding a dependency without updating `package.json`** — always declare `workspace:*` deps
- **Running builds out of order** — use `pnpm turbo run build` which handles ordering
- **Changing a shared-types interface without updating all consumers** — TypeScript will catch this, but run `pnpm typecheck` to verify
- **Creating circular dependencies between packages** — the build graph must be a DAG: `shared-types` → `db-schema`/`providers` → `core` → `apps`
