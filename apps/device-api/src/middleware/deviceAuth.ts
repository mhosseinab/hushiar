import type { DeviceManager } from '@hushiar/core';
import type { NextFunction, Request, Response } from 'express';

export function createDeviceAuthMiddleware(deviceManager: DeviceManager) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const manufactureId = req.headers.devicemanufactureid;
    if (!manufactureId || typeof manufactureId !== 'string') {
      res.status(403).json({ message: 'Missing devicemanufactureid header' });
      return;
    }
    const device = await deviceManager.getByManufactureId(manufactureId);
    if (!device) {
      res.status(403).json({ message: 'Device not found' });
      return;
    }
    req.device = device;
    next();
  };
}
