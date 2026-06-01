import type { ImageManager } from '@hushiar/core';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import { Types } from 'mongoose';

export function createImageRouter(imageManager: ImageManager, checkAuth: RequestHandler): Router {
  const router = Router();

  // POST /image/getAll_device
  router.post('/image/getAll_device', checkAuth, async (req, res) => {
    const rawDeviceId = req.headers.deviceid;
    const deviceId = typeof rawDeviceId === 'string' ? rawDeviceId : undefined;
    if (!deviceId) {
      res.status(400).json({ message: 'deviceid header is required' });
      return;
    }
    try {
      const imageList = await imageManager.getAllByDevice(new Types.ObjectId(deviceId));
      res.json({ imageList });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // POST /image/delete
  router.post('/image/delete', checkAuth, async (req, res) => {
    const user = req.user!;
    const { imageId } = req.body as { imageId?: string };
    const rawDeviceId = req.headers.deviceid;
    const deviceId = typeof rawDeviceId === 'string' ? rawDeviceId : undefined;

    if (!imageId || !deviceId) {
      res.status(400).json({ message: 'imageId and deviceid are required' });
      return;
    }
    try {
      const deletedImage = await imageManager.deleteByDeviceAndId(
        user._id.toString(),
        new Types.ObjectId(deviceId),
        new Types.ObjectId(imageId),
      );
      res.json({ imageList: deletedImage });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // GET /image/get
  router.get('/image/get', checkAuth, async (req, res) => {
    const user = req.user!;
    const rawDeviceId = req.headers.deviceid;
    const rawImageId = req.headers.imageid;
    const deviceId = typeof rawDeviceId === 'string' ? rawDeviceId : undefined;
    const imageId = typeof rawImageId === 'string' ? rawImageId : undefined;

    if (!deviceId || !imageId) {
      res.status(400).json({ message: 'deviceid and imageid headers are required' });
      return;
    }
    try {
      const deviceObjId = new Types.ObjectId(deviceId);
      const imageObjId = new Types.ObjectId(imageId);
      const foundImage = await imageManager.getById(deviceObjId, imageObjId);
      if (!foundImage) {
        res
          .status(400)
          .json({ message: `No Image Found with Id ${imageId} for device ${deviceId}` });
        return;
      }
      const imagePath = imageManager.getImagePath(
        user._id.toString(),
        deviceId,
        foundImage.fileName ?? '',
      );
      const contentBase64 = await imageManager.getBase64FromPath(imagePath);
      const imageInfo = {
        _id: foundImage._id,
        contentBase64,
        registerDate: foundImage.registerDate,
        deviceId: (foundImage as { device?: { _id?: unknown } }).device?._id,
      };
      res.json({ imageInfo });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  return router;
}
