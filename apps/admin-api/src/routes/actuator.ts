import { type Request, type Response, Router } from 'express';
import type { Container } from '../container.js';

export function actuatorRouter(container: Container): Router {
  const router = Router();
  const { actuatorManager } = container;

  // Hardcoded test stub — ported as-is from legacy
  router.get('/add', (_req: Request, res: Response): void => {
    const type = 'Alarm';

    actuatorManager
      .add(type, 'InStock')
      .then((actuator) => {
        res.json({ actuator });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        res.status(400).json({ message });
      });
  });

  return router;
}
