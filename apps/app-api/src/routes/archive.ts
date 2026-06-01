import type { ArchiveManager, DeviceManager, ImageManager, VideoManager } from '@hushiar/core';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import { Types } from 'mongoose';

export function createArchiveRouter(
  archiveManager: ArchiveManager,
  deviceManager: DeviceManager,
  videoManager: VideoManager,
  imageManager: ImageManager,
  checkAuth: RequestHandler,
): Router {
  const router = Router();

  // GET /archive/getAll_device
  router.get('/archive/getAll_device', checkAuth, async (req, res) => {
    const rawDeviceId = req.headers.deviceid;
    const deviceId = typeof rawDeviceId === 'string' ? rawDeviceId : undefined;
    if (!deviceId) {
      res.status(400).json({ message: 'deviceid header is required' });
      return;
    }
    try {
      const archiveList = await archiveManager.getAllByDevice(new Types.ObjectId(deviceId));
      res.json({ archiveList });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // GET /archive/getAll_user
  router.get('/archive/getAll_user', checkAuth, async (req, res) => {
    const user = req.user!;
    try {
      const userDevices = await deviceManager.getAllByUser(user._id.toString());
      const deviceIds = userDevices.map((d) => d._id);
      const archiveList = await archiveManager.getAllByDeviceList(deviceIds);
      res.json({ archiveList });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // GET /archive/getOne
  router.get('/archive/getOne', checkAuth, async (req, res) => {
    const rawArchiveId = req.headers.archiveid;
    const archiveId = typeof rawArchiveId === 'string' ? rawArchiveId : undefined;
    if (!archiveId) {
      res.status(400).json({ message: 'archiveid header is required' });
      return;
    }
    try {
      const archive = await archiveManager.get(new Types.ObjectId(archiveId));
      res.json({ archive });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // POST /archive/delete
  router.post('/archive/delete', checkAuth, async (req, res) => {
    const user = req.user!;
    const { archiveId } = req.body as { archiveId?: string };
    const rawDeviceId = req.headers.deviceid;
    const deviceId = typeof rawDeviceId === 'string' ? rawDeviceId : undefined;
    if (!archiveId || !deviceId) {
      res.status(400).json({ message: 'archiveId and deviceid are required' });
      return;
    }
    try {
      const deletedArchive = await archiveManager.deleteByDeviceAndId(
        user._id.toString(),
        new Types.ObjectId(deviceId),
        new Types.ObjectId(archiveId),
      );
      res.json({ archive: deletedArchive });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // GET /video/:token/:archiveId
  router.get('/video/:token/:archiveId', checkAuth, async (req, res) => {
    const user = req.user!;
    const { archiveId } = req.params as { archiveId?: string };
    if (!archiveId) {
      res.status(400).json({ message: 'archiveId is required' });
      return;
    }
    try {
      const foundArchive = await archiveManager.get(new Types.ObjectId(archiveId));
      if (!foundArchive) {
        res.status(400).json({ message: `No Archive Found With id ${archiveId}` });
        return;
      }
      const videoFileName = (foundArchive as { videoFileName?: string }).videoFileName;
      if (!videoFileName) {
        res
          .status(400)
          .json({ message: `No video for Archive Found ${foundArchive._id.toString()}` });
        return;
      }
      const deviceId = (
        (foundArchive as { device?: { _id?: unknown } }).device?._id ?? ''
      ).toString();
      const archiveVideoPath = videoManager.getVideoPath(
        user._id.toString(),
        deviceId,
        videoFileName,
      );
      res.sendFile(archiveVideoPath);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // GET /video/getAll_device
  router.get('/video/getAll_device', checkAuth, async (req, res) => {
    const user = req.user!;
    const rawDeviceId = req.headers.deviceid;
    const deviceId = typeof rawDeviceId === 'string' ? rawDeviceId : undefined;
    if (!deviceId) {
      res.status(400).json({ message: 'deviceid header is required' });
      return;
    }
    try {
      const videoArchiveList = await archiveManager.getAllVideoByDevice(
        new Types.ObjectId(deviceId),
      );

      // Build response with thumbnail
      const videoList = await Promise.all(
        videoArchiveList.map(async (videoArchive) => {
          const images = (videoArchive as { imageList?: { fileName?: string }[] }).imageList;
          if (images && images.length > 0) {
            const image = images[0];
            if (image?.fileName) {
              const imageFilePath = imageManager.getImagePath(
                user._id.toString(),
                deviceId,
                image.fileName,
              );
              try {
                const thumbnailBase64 = await imageManager.getBase64FromPath(imageFilePath);
                return {
                  _id: videoArchive._id,
                  thumbnailBase64,
                  startDate: (videoArchive as { startDate?: Date }).startDate,
                };
              } catch {
                // image file missing, return without thumbnail
              }
            }
          }
          return {
            _id: videoArchive._id,
            startDate: (videoArchive as { startDate?: Date }).startDate,
          };
        }),
      );

      res.json({ videoList });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  return router;
}
