import type { ActuatorManager, ImageManager, MqttManager } from '@hushiar/core';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import { Types } from 'mongoose';

export function createActuatorRouter(
  actuatorManager: ActuatorManager,
  mqttManager: MqttManager,
  imageManager: ImageManager,
  checkAuth: RequestHandler,
): Router {
  const router = Router();

  // GET /actuator/getAll_device
  router.get('/actuator/getAll_device', checkAuth, async (req, res) => {
    const rawDeviceId = req.headers.deviceid;
    const deviceId = typeof rawDeviceId === 'string' ? rawDeviceId : undefined;
    if (!deviceId) {
      res.status(400).json({ message: 'deviceid header is required' });
      return;
    }
    try {
      const actuatorList = await actuatorManager.getAllByDevice(new Types.ObjectId(deviceId));
      res.json({ actuatorList });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // GET /actuator/getImageList  (was getImageListt — fixed typo)
  router.get('/actuator/getImageList', checkAuth, async (req, res) => {
    const rawDeviceId = req.headers.deviceid;
    const rawActuatorId = req.headers.actuatorid;
    const deviceId = typeof rawDeviceId === 'string' ? rawDeviceId : undefined;
    const actuatorId = typeof rawActuatorId === 'string' ? rawActuatorId : undefined;

    if (!deviceId || !actuatorId) {
      res.status(400).json({ message: 'deviceid and actuatorid headers are required' });
      return;
    }
    try {
      const imageList = await imageManager.getAllByDevice(new Types.ObjectId(deviceId));
      res.json({ imageList });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // GET /actuator/getStream
  router.get('/actuator/getStream', (_req, res) => {
    const videoStoragePath = process.env.CAMERA_VIDEO_STORAGE_PATH ?? './storage/video';
    const outputFilePath = `${videoStoragePath}/stream.mp4`;
    res.download(outputFilePath, 'stream.mp4');
  });

  // GET /actuator/getLastImage/:timeStamp
  router.get('/actuator/getLastImage/:timeStamp', checkAuth, async (req, res) => {
    const rawDeviceId = req.headers.deviceid;
    const rawActuatorId = req.headers.actuatorid;
    const rawCurrentImageId = req.headers.currentimageid;

    const deviceId = typeof rawDeviceId === 'string' ? rawDeviceId : undefined;
    const actuatorId = typeof rawActuatorId === 'string' ? rawActuatorId : undefined;
    const currentImageId = typeof rawCurrentImageId === 'string' ? rawCurrentImageId : undefined;

    if (!deviceId || !actuatorId) {
      res.status(400).json({ message: 'deviceid and actuatorid headers are required' });
      return;
    }
    try {
      const deviceObjId = new Types.ObjectId(deviceId);
      const actuatorObjId = new Types.ObjectId(actuatorId);

      const cachedEntry = imageManager.getDeviceLastImage(deviceObjId, actuatorObjId);
      if (cachedEntry) {
        if (
          currentImageId !== 'NaN' &&
          currentImageId &&
          cachedEntry.imageId.toString() === currentImageId
        ) {
          res.json({
            image: {
              _id: undefined,
              contentBase64: undefined,
              registerDate: undefined,
              deviceId,
              actuatorId,
            },
          });
        } else {
          const img = await imageManager.getById(deviceObjId, cachedEntry.imageId);
          res.json({ image: img });
        }
      } else {
        res.json({
          image: {
            _id: undefined,
            contentBase64: undefined,
            registerDate: undefined,
            deviceId,
            actuatorId,
          },
        });
      }
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // POST /actuator/isActive
  router.post('/actuator/isActive', checkAuth, async (req, res) => {
    const rawDeviceId = req.headers.deviceid;
    const rawActuatorId = req.headers.actuatorid;
    const deviceId = typeof rawDeviceId === 'string' ? rawDeviceId : undefined;
    const actuatorId = typeof rawActuatorId === 'string' ? rawActuatorId : undefined;
    const { isActive } = req.body as { isActive?: boolean };

    if (!deviceId || !actuatorId) {
      res.status(400).json({ message: 'deviceid and actuatorid headers are required' });
      return;
    }
    try {
      const deviceObjId = new Types.ObjectId(deviceId);
      const actuatorObjId = new Types.ObjectId(actuatorId);

      const foundActuator = await actuatorManager.getById(deviceObjId, actuatorObjId);
      if (!foundActuator) {
        res.status(400).json({
          message: `No Actuator Found With deviceId ${deviceId} and actuatorId ${actuatorId}`,
        });
        return;
      }

      const token = (foundActuator as { device?: { token?: string } }).device?.token ?? '';
      const type = foundActuator.type ?? '';
      mqttManager.setStatus(token, type, !!isActive);

      if (foundActuator.isActive !== !!isActive) {
        await actuatorManager.setIsActive(deviceObjId, actuatorObjId, !!isActive);
      }

      // Re-fetch to get updated
      const updatedActuator = await actuatorManager.getById(deviceObjId, actuatorObjId);
      res.json({ actuator: updatedActuator });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  return router;
}
