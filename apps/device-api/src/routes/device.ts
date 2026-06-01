import type {
  ActuatorManager,
  DeviceManager,
  LogManager,
  MqttManager,
  SensorManager,
} from '@hushiar/core';
import { Router } from 'express';

export function createDeviceRouter(
  deviceManager: DeviceManager,
  sensorManager: SensorManager,
  actuatorManager: ActuatorManager,
  logManager: LogManager,
  mqttManager: MqttManager,
): Router {
  const router = Router();

  // Register device and obtain MQTT token
  router.get('/register/:manufactureId', async (req, res) => {
    const { manufactureId } = req.params;
    try {
      const result = await deviceManager.registerDeviceToken(manufactureId);
      if (!result) {
        res.status(403).json({ message: 'Device not found' });
        return;
      }

      const device = await deviceManager.getByManufactureId(manufactureId);
      if (!device) {
        res.status(403).json({ message: 'Device not found' });
        return;
      }

      await mqttManager.subscribeDeviceTopic(result.token);
      mqttManager.setToken(manufactureId, result.token);

      const [actuators, sensors] = await Promise.all([
        actuatorManager.getAllByDevice(device._id),
        sensorManager.getAllByDevice(device._id),
      ]);

      for (const sensor of sensors) {
        mqttManager.setStatus(result.token, sensor.type, sensor.isActive ?? false);
      }
      for (const actuator of actuators) {
        mqttManager.setStatus(result.token, actuator.type, actuator.isActive ?? false);
      }
      mqttManager.setResolution(result.token, 7);

      await logManager.ingestGetToken(device._id).catch(console.error);

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  // Device heartbeat — simple acknowledge
  router.post('/device/heartBeat', (_req, res) => {
    res.json({ type: true });
  });

  return router;
}
