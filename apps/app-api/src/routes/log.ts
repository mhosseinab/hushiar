import type { DeviceManager, LogManager } from '@hushiar/core';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import { Types } from 'mongoose';

export function createLogRouter(
  logManager: LogManager,
  deviceManager: DeviceManager,
  checkAuth: RequestHandler,
): Router {
  const router = Router();

  // GET /log/getAll_device
  router.get('/log/getAll_device', checkAuth, async (req, res) => {
    const rawDeviceId = req.headers.deviceid;
    const deviceId = typeof rawDeviceId === 'string' ? rawDeviceId : undefined;
    if (!deviceId) {
      res.status(400).json({ message: 'deviceid header is required' });
      return;
    }
    try {
      const logList = await logManager.getAllByDevice(new Types.ObjectId(deviceId));
      res.json({ logList });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // GET /log/getAll_user
  router.get('/log/getAll_user', checkAuth, async (req, res) => {
    const user = req.user!;
    try {
      const userDevices = await deviceManager.getAllByUser(user._id.toString());
      const deviceIds = userDevices.map((d) => d._id);
      const logList = await logManager.getAllByDeviceList(deviceIds);
      res.json({ logList });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  return router;
}
