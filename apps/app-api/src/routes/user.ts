import type { UserManager } from '@hushiar/core';
import type { WebPushSubscription } from '@hushiar/shared-types';
import { Router } from 'express';
import type { RequestHandler } from 'express';

export function createUserRouter(userManager: UserManager, checkAuth: RequestHandler): Router {
  const router = Router();

  // GET /user/get
  router.get('/user/get', checkAuth, (req, res) => {
    res.json({ user: req.user });
  });

  // POST /user/updateInfo
  router.post('/user/updateInfo', checkAuth, async (req, res) => {
    const user = req.user!;
    const { title, email } = req.body as { title?: string; email?: string };
    try {
      const updatedUser = await userManager.updateInfo(
        user._id.toString(),
        title ?? '',
        email ?? '',
      );
      res.json({ user: updatedUser });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // POST /user/subscribeWebPush
  router.post('/user/subscribeWebPush', checkAuth, async (req, res) => {
    const user = req.user!;
    const { sub } = req.body as { sub?: WebPushSubscription };
    if (!sub) {
      res.status(400).json({ message: 'sub is required' });
      return;
    }
    try {
      // Dedupe: fetch user, check if subscription already exists
      const foundUser = await userManager.get(user._id.toString());
      if (!foundUser) {
        res.status(400).json({ message: `No User found With ID ${user._id.toString()}` });
        return;
      }
      const existingSub = foundUser.wpSubList?.find(
        (wsSub) => wsSub.keys.p256dh === sub.keys.p256dh && wsSub.keys.auth === sub.keys.auth,
      );
      if (existingSub) {
        res.json({ user: foundUser });
        return;
      }
      const updatedUser = await userManager.addWebPushSub(user._id.toString(), sub);
      res.json({ user: updatedUser });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // POST /user/increaseCredit
  router.post('/user/increaseCredit', checkAuth, (_req, res) => {
    // Legacy stub — always returns a payment URL
    res.json({ paymentUrl: 'https://vandar.io/request/AD8TA29FFV' });
  });

  return router;
}
