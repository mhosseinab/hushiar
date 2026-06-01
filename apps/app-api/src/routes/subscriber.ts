import type { DeviceManager, LogManager, SubscriberManager } from '@hushiar/core';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import { Types } from 'mongoose';

export function createSubscriberRouter(
  subscriberManager: SubscriberManager,
  deviceManager: DeviceManager,
  logManager: LogManager,
  checkAuth: RequestHandler,
): Router {
  const router = Router();

  // POST /subscriber/add
  router.post('/subscriber/add', checkAuth, async (req, res) => {
    const user = req.user!;
    const { deviceId, title, mobileNumber } = req.body as {
      deviceId?: string;
      title?: string;
      mobileNumber?: string;
    };
    if (!deviceId || !mobileNumber) {
      res.status(400).json({ message: 'deviceId and mobileNumber are required' });
      return;
    }
    try {
      const foundDevice = await deviceManager.getByUser(user._id.toString(), deviceId);
      if (!foundDevice) {
        res.status(400).json({ message: `No Device Found With Id ${deviceId}` });
        return;
      }
      const newSubscriber = await subscriberManager.add(foundDevice._id, title ?? '', mobileNumber);
      // Fire-and-forget log
      void logManager.ingestAddSubscriber(foundDevice._id, title ?? '').catch(console.error);
      res.json({ subscriber: newSubscriber });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // POST /subscriber/remove
  router.post('/subscriber/remove', checkAuth, async (req, res) => {
    const { deviceId, subscriberId } = req.body as {
      deviceId?: string;
      subscriberId?: string;
    };
    if (!deviceId || !subscriberId) {
      res.status(400).json({ message: 'deviceId and subscriberId are required' });
      return;
    }
    try {
      await subscriberManager.remove(
        new Types.ObjectId(deviceId),
        new Types.ObjectId(subscriberId),
      );
      res.json({ subscriber: null });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // GET /subscriber/getAll_device
  router.get('/subscriber/getAll_device', checkAuth, async (req, res) => {
    const rawDeviceId = req.headers.deviceid;
    const deviceId = typeof rawDeviceId === 'string' ? rawDeviceId : undefined;
    if (!deviceId) {
      res.status(400).json({ message: 'deviceid header is required' });
      return;
    }
    try {
      const subscriberList = await subscriberManager.getAllByDevice(new Types.ObjectId(deviceId));
      res.json({ subscriberList });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  return router;
}
