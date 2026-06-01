import type { SensorManager } from '@hushiar/core';
import { Router } from 'express';

export function createSensorRouter(sensorManager: SensorManager): Router {
  const router = Router();

  // Attach sensor to device
  router.get('/sensor/attached', async (req, res) => {
    const device = req.device;
    if (!device) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const sensorManufactureId = req.query.sensorManufactureId;
    if (!sensorManufactureId || typeof sensorManufactureId !== 'string') {
      res.status(400).json({ message: 'Missing sensorManufactureId query param' });
      return;
    }
    try {
      const updatedSensor = await sensorManager.attach(sensorManufactureId, device._id);
      if (!updatedSensor) {
        res
          .status(404)
          .json({ message: `Sensor not found with manufactureId ${sensorManufactureId}` });
        return;
      }
      res.json({ sensor: updatedSensor });
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  // Detach sensor from device
  router.get('/sensor/detach', async (req, res) => {
    const device = req.device;
    if (!device) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const sensorManufactureId = req.query.sensorManufactureId;
    if (!sensorManufactureId || typeof sensorManufactureId !== 'string') {
      res.status(400).json({ message: 'Missing sensorManufactureId query param' });
      return;
    }
    try {
      const updatedSensor = await sensorManager.detach(sensorManufactureId, device._id);
      if (!updatedSensor) {
        res
          .status(404)
          .json({ message: `Sensor not found with manufactureId ${sensorManufactureId}` });
        return;
      }
      res.json({ sensor: updatedSensor });
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  return router;
}
