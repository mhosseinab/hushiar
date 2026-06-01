import { ImageModel } from '@hushiar/db-schema';
import { type Request, type Response, Router } from 'express';
import mongoose from 'mongoose';
import type { Container } from '../container.js';

export function imageRouter(container: Container): Router {
  const router = Router();
  const { imageManager } = container;

  router.get('/getAll', (_req: Request, res: Response): void => {
    ImageModel.find({})
      .sort({ registerDate: -1 })
      .then((foundImageList) => {
        res.json({ imageList: foundImageList });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        res.status(400).json({ message });
      });
  });

  router.get('/getAll_device/:deviceId', (req: Request, res: Response): void => {
    const deviceIdParam = req.params.deviceId;
    const deviceId = Array.isArray(deviceIdParam) ? deviceIdParam[0] : deviceIdParam;

    if (!deviceId) {
      res.status(400).json({ message: 'deviceId is required' });
      return;
    }

    imageManager
      .getAllByDevice(new mongoose.Types.ObjectId(deviceId))
      .then((foundImageList) => {
        let htmlResponse = '<html>';
        for (const image of foundImageList) {
          htmlResponse += `<img src="https://cdn.hushiar.com/${image.fileName}" style="width:100px" /><br>`;
        }
        htmlResponse += '</html>';
        res.send(htmlResponse);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        res.status(400).json({ message });
      });
  });

  return router;
}
