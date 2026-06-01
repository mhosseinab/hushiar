import type { AuthManager } from '@hushiar/core';
import type { IUser } from '@hushiar/shared-types';
import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import type { Types } from 'mongoose';

export function createAuthMiddleware(authManager: AuthManager) {
  return async function checkAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token = (req.headers.token ?? req.params.token) as string | undefined;
    if (!token) {
      res.status(403).json({ message: 'Access Denied' });
      return;
    }
    try {
      const auth = await authManager.getById(new mongoose.Types.ObjectId(token));
      if (!auth?.user) {
        res.status(403).json({ message: 'Access Denied' });
        return;
      }
      req.user = auth.user as unknown as IUser & { _id: Types.ObjectId };
      next();
    } catch {
      res.status(403).json({ message: 'Access Denied' });
    }
  };
}
