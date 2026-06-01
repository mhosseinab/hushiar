import type { DeviceTypeManager } from '@hushiar/core';
import { Router } from 'express';
import type { RequestHandler } from 'express';

export function createDeviceTypeRouter(
  deviceTypeManager: DeviceTypeManager,
  checkAuth: RequestHandler,
): Router {
  const router = Router();

  // GET /deviceType/getAll
  router.get('/deviceType/getAll', checkAuth, async (_req, res) => {
    try {
      const deviceTypeList = await deviceTypeManager.getAll();
      res.json({ deviceTypeList });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  return router;
}
