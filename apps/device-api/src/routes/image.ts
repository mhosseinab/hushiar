import type { ActuatorManager, ImageManager, LogManager } from '@hushiar/core';
import type { IDevicePopulated } from '@hushiar/shared-types';
import { Router } from 'express';
import type { Types } from 'mongoose';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
  },
});

export function createImageRouter(
  imageManager: ImageManager,
  actuatorManager: ActuatorManager,
  logManager: LogManager,
): Router {
  const router = Router();

  // Upload image from device camera
  router.post('/upload/image', upload.single('imageFile'), async (req, res) => {
    const device = req.device;
    if (!device) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ message: 'No image file provided' });
      return;
    }

    try {
      // device.user may be populated; get a usable string id
      const populated = device as unknown as IDevicePopulated & { _id: Types.ObjectId };
      const userId =
        populated.user != null && typeof populated.user === 'object' && '_id' in populated.user
          ? populated.user._id.toString()
          : (device.user?.toString() ?? '');
      const deviceId = device._id.toString();

      const actuator = await actuatorManager.getByDeviceAndType(device._id, 'Capture');
      if (!actuator) {
        res.status(404).json({ message: 'No Capture actuator found for device' });
        return;
      }

      const fileName = await imageManager.storeImage(userId, deviceId, req.file.buffer);
      const savedImage = await imageManager.create(device._id, actuator._id, fileName, req.file);

      await logManager.ingestImageCaptured(device._id, savedImage._id).catch(console.error);

      res.json({ image: savedImage });
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  return router;
}
