import { type Request, type Response, Router } from 'express';
import mongoose from 'mongoose';
import type { Container } from '../container.js';

export function userRouter(container: Container): Router {
  const router = Router();
  const { userManager } = container;

  router.get('/getAll', (_req: Request, res: Response): void => {
    userManager
      .getAll()
      .then((foundUserList) => {
        res.json({ userList: foundUserList });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        res.status(400).json({ message });
      });
  });

  router.post('/notifyTest', (req: Request, res: Response): void => {
    const userId = new mongoose.Types.ObjectId(req.body.userId as string);
    const deviceTitle = 'پیغام اومد؟';
    // Placeholder deviceId for test notification
    const deviceId = new mongoose.Types.ObjectId('000000000000000000000000');

    userManager
      .webPushNotify(userId, deviceTitle, deviceId)
      .then(() => {
        res.json({ result: 'ok' });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        res.status(400).json({ message });
      });
  });

  return router;
}
