import { type Request, type Response, Router } from 'express';
import mongoose from 'mongoose';
import type { Container } from '../container.js';

export function archiveRouter(container: Container): Router {
  const router = Router();
  const { archiveManager } = container;

  router.post('/removeAllByDevice', (req: Request, res: Response): void => {
    const deviceId = new mongoose.Types.ObjectId(req.body.deviceId as string);

    archiveManager
      .removeByDevice(deviceId)
      .then(() => {
        res.json({ status: 'done' });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        res.status(400).json({ message });
      });
  });

  return router;
}
