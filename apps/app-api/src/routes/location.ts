import type { LocationManager } from '@hushiar/core';
import { Router } from 'express';
import type { RequestHandler } from 'express';

export function createLocationRouter(
  locationManager: LocationManager,
  checkAuth: RequestHandler,
): Router {
  const router = Router();

  // GET /location/getAll
  router.get('/location/getAll', checkAuth, async (req, res) => {
    try {
      const user = req.user!;
      const locationList = await locationManager.getAllByUser(user._id);
      res.json({ locationList });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // POST /location/add
  router.post('/location/add', checkAuth, async (req, res) => {
    const user = req.user!;
    const { title } = req.body as { title?: string };
    try {
      const location = await locationManager.add(user._id, title ?? '');
      res.json({ location });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  return router;
}
