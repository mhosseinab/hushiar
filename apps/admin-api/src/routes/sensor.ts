import { type Request, type Response, Router } from 'express';
import type { Container } from '../container.js';

export function sensorRouter(container: Container): Router {
  const router = Router();
  const { sensorManager } = container;

  // Hardcoded test stub — ported as-is from legacy
  router.get('/add', (_req: Request, res: Response): void => {
    const type = 'Detector';

    sensorManager
      .add(type, 'InStock')
      .then((sensor) => {
        res.json({ sensor });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        res.status(400).json({ message });
      });
  });

  return router;
}
