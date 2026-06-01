import type { AuthManager, NotifyManager, UserManager } from '@hushiar/core';
import { Router } from 'express';

export function createAuthRouter(
  userManager: UserManager,
  authManager: AuthManager,
  notifyManager: NotifyManager,
): Router {
  const router = Router();

  // POST /user/signup
  router.post('/user/signup', async (req, res) => {
    const { title, mobileNumber } = req.body as { title?: string; mobileNumber?: string };
    if (!mobileNumber) {
      res.status(400).json({ message: 'mobileNumber is required' });
      return;
    }
    try {
      const newUser = await userManager.create(title ?? '', mobileNumber);
      res.json({ user: newUser });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // POST /user/signinWithMobileNumber
  router.post('/user/signinWithMobileNumber', async (req, res) => {
    const { mobileNumber } = req.body as { mobileNumber?: string };
    if (!mobileNumber) {
      res.status(400).json({ message: 'mobileNumber is required' });
      return;
    }
    try {
      // Find or create user
      let user = await userManager.getByMobileNumber(mobileNumber);
      if (!user) {
        user = await userManager.createByMobileNumber(mobileNumber);
      }

      // Get or create auth, then revoke token and send it
      let auth = await authManager.getByUser(user._id);
      if (!auth) {
        auth = await authManager.createForUser(user._id);
      } else {
        auth = await authManager.revokeToken(auth);
      }

      await notifyManager.sendVerificationCode(mobileNumber, String(auth.authToken));

      res.json({ type: true });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // POST /user/checkCodeWithMobileNumber
  router.post('/user/checkCodeWithMobileNumber', async (req, res) => {
    const { mobileNumber, code } = req.body as { mobileNumber?: string; code?: string };
    if (!mobileNumber || !code) {
      res.status(400).json({ message: 'mobileNumber and code are required' });
      return;
    }
    const authToken = Number(code);
    if (Number.isNaN(authToken)) {
      res.status(400).json({ message: 'Invalid code' });
      return;
    }
    try {
      const foundUser = await userManager.getByMobileNumber(mobileNumber);
      if (!foundUser) {
        res.status(400).json({ message: 'کاربر پیدا نشد' });
        return;
      }
      const foundAuth = await authManager.getByUserAndToken(foundUser._id, authToken);
      if (!foundAuth) {
        res.status(400).json({ message: 'کد تایید صحیح نمیباشد.' });
        return;
      }
      await userManager.validateMobileNumber(foundUser._id.toString());
      res.json({ auth: foundAuth._id });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  return router;
}
