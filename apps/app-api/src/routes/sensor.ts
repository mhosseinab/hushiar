import type { MqttManager, SensorManager } from '@hushiar/core';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import { Types } from 'mongoose';

export function createSensorRouter(
  sensorManager: SensorManager,
  mqttManager: MqttManager,
  checkAuth: RequestHandler,
): Router {
  const router = Router();

  // GET /sensor/getAll_device
  router.get('/sensor/getAll_device', checkAuth, async (req, res) => {
    const rawDeviceId = req.headers.deviceid;
    const deviceId = typeof rawDeviceId === 'string' ? rawDeviceId : undefined;
    if (!deviceId) {
      res.status(400).json({ message: 'deviceid header is required' });
      return;
    }
    try {
      const sensorList = await sensorManager.getAllByDevice(new Types.ObjectId(deviceId));
      res.json({ sensorList });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // POST /sensor/isActive
  router.post('/sensor/isActive', checkAuth, async (req, res) => {
    const rawDeviceId = req.headers.deviceid;
    const rawSensorId = req.headers.sensorid;
    const deviceId = typeof rawDeviceId === 'string' ? rawDeviceId : undefined;
    const sensorId = typeof rawSensorId === 'string' ? rawSensorId : undefined;
    const { isActive } = req.body as { isActive?: boolean };

    if (!deviceId || !sensorId) {
      res.status(400).json({ message: 'deviceid and sensorid headers are required' });
      return;
    }
    try {
      const deviceObjId = new Types.ObjectId(deviceId);
      const sensorObjId = new Types.ObjectId(sensorId);
      const foundSensor =
        (await sensorManager.getByManufactureId(sensorId)) ??
        (await (async () => {
          // fallback: find by id+device
          const all = await sensorManager.getAllByDevice(deviceObjId);
          return all.find((s) => s._id.toString() === sensorId) ?? null;
        })());

      if (!foundSensor) {
        res
          .status(400)
          .json({ message: `No Sensor Found With deviceId ${deviceId} and sensorId ${sensorId}` });
        return;
      }

      const token = (foundSensor as { device?: { token?: string } }).device?.token ?? '';
      const type = foundSensor.type ?? '';
      mqttManager.setStatus(token, type, !!isActive);

      await sensorManager.setIsActive(deviceObjId, sensorObjId, !!isActive);

      const updatedSensors = await sensorManager.getAllByDevice(deviceObjId);
      const updatedSensor = updatedSensors.find((s) => s._id.toString() === sensorId);
      res.json({ sensor: updatedSensor });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  return router;
}
