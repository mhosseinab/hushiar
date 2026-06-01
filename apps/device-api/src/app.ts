import type {
  ActuatorManager,
  CommandManager,
  DeviceManager,
  ImageManager,
  LogManager,
  MqttManager,
  SensorManager,
} from '@hushiar/core';
import cors from 'cors';
import express from 'express';
import { createDeviceAuthMiddleware } from './middleware/deviceAuth.js';
import { createActuatorRouter } from './routes/actuator.js';
import { createDeviceProtectedRouter } from './routes/device-protected.js';
import { createDeviceRouter } from './routes/device.js';
import { createImageRouter } from './routes/image.js';
import { createLogRouter } from './routes/log.js';
import { createSensorRouter } from './routes/sensor.js';

const PACKAGE_NAME = 'api.device.hs';

interface AppManagers {
  deviceManager: DeviceManager;
  sensorManager: SensorManager;
  actuatorManager: ActuatorManager;
  imageManager: ImageManager;
  logManager: LogManager;
  mqttManager: MqttManager;
  commandManager: CommandManager;
}

export function createApp(managers: AppManagers): express.Express {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());

  app.get('/isAlive', (_req, res) => {
    res.json({ message: `${PACKAGE_NAME} is Alive!` });
  });

  app.use(
    createDeviceRouter(
      managers.deviceManager,
      managers.sensorManager,
      managers.actuatorManager,
      managers.logManager,
      managers.mqttManager,
    ),
  );

  const deviceAuth = createDeviceAuthMiddleware(managers.deviceManager);
  app.use(deviceAuth);

  app.use(createDeviceProtectedRouter(managers.deviceManager, managers.commandManager));
  app.use(createSensorRouter(managers.sensorManager));
  app.use(createActuatorRouter(managers.actuatorManager));
  app.use(createImageRouter(managers.imageManager, managers.actuatorManager, managers.logManager));
  app.use(createLogRouter(managers.logManager));

  return app;
}
