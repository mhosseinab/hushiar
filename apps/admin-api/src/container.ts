import 'dotenv/config';
import {
  ActuatorManager,
  ArchiveManager,
  DeviceManager,
  ImageManager,
  LogManager,
  SensorManager,
  UserManager,
} from '@hushiar/core';
import {
  ActuatorModel,
  ArchiveModel,
  DeviceModel,
  ImageModel,
  LogModel,
  SensorModel,
  UserModel,
} from '@hushiar/db-schema';
import { InfluxProvider, WebPushProvider } from '@hushiar/providers';
import { z } from 'zod';

const env = z
  .object({
    MONGO_URI: z.string().default('mongodb://localhost:27017/hushiar'),
    VAPID_PUBLIC_KEY: z.string(),
    VAPID_PRIVATE_KEY: z.string(),
    VAPID_EMAIL: z.string().default('admin@hushiar.com'),
    INFLUX_URL: z.string().default(''),
    INFLUX_TOKEN: z.string().default(''),
    INFLUX_ORG: z.string().default(''),
    INFLUX_BUCKET: z.string().default(''),
  })
  .parse(process.env);

export function createContainer() {
  const webPushProvider = new WebPushProvider({
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
    email: env.VAPID_EMAIL,
  });

  const influxProvider = new InfluxProvider({
    url: env.INFLUX_URL,
    token: env.INFLUX_TOKEN,
    org: env.INFLUX_ORG,
    bucket: env.INFLUX_BUCKET,
  });

  const deviceManager = new DeviceManager(DeviceModel);
  const sensorManager = new SensorManager(SensorModel);
  const actuatorManager = new ActuatorManager(ActuatorModel);
  const imageManager = new ImageManager(ImageModel);
  const userManager = new UserManager(UserModel, webPushProvider);
  const logManager = new LogManager(LogModel, influxProvider);
  const archiveManager = new ArchiveManager(ArchiveModel);

  return {
    deviceManager,
    sensorManager,
    actuatorManager,
    imageManager,
    userManager,
    logManager,
    archiveManager,
  };
}

export type Container = ReturnType<typeof createContainer>;
