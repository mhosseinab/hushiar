import type { ActuatorManager } from '@hushiar/core';
import { Router } from 'express';

export function createActuatorRouter(actuatorManager: ActuatorManager): Router {
  const router = Router();

  // Attach actuator to device
  router.get('/actuator/attached', async (req, res) => {
    const device = req.device;
    if (!device) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const actuatorManufactureId = req.query.actuatorManufactureId;
    if (!actuatorManufactureId || typeof actuatorManufactureId !== 'string') {
      res.status(400).json({ message: 'Missing actuatorManufactureId query param' });
      return;
    }
    try {
      const updatedActuator = await actuatorManager.assignDevice(actuatorManufactureId, device._id);
      if (!updatedActuator) {
        res
          .status(404)
          .json({ message: `Actuator not found with manufactureId ${actuatorManufactureId}` });
        return;
      }
      res.json({ actuator: updatedActuator });
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  return router;
}
