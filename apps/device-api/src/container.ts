import {
  ActuatorManager,
  CommandManager,
  DeviceManager,
  ImageManager,
  LogManager,
  MqttManager,
  SensorManager,
} from '@hushiar/core';
import {
  ActuatorModel,
  CommandModel,
  DeviceModel,
  ImageModel,
  LogModel,
  SensorModel,
} from '@hushiar/db-schema';
import { InfluxProvider, MqttProvider } from '@hushiar/providers';
import { z } from 'zod';

const envSchema = z.object({
  HUSHIAR_MQTT_HOST: z.string().min(1),
  HUSHIAR_MQTT_PORT: z.coerce.number().int().positive(),
  HUSHIAR_MQTT_USERNAME: z.string().min(1),
  HUSHIAR_MQTT_PASSWORD: z.string().min(1),
  INFLUX_URL: z.string().url(),
  INFLUX_TOKEN: z.string().min(1),
  INFLUX_ORG: z.string().min(1),
  INFLUX_BUCKET: z.string().min(1),
});

export type Container = ReturnType<typeof createContainer>;

export function createContainer() {
  const env = envSchema.parse(process.env);

  const mqttProvider = new MqttProvider({
    host: env.HUSHIAR_MQTT_HOST,
    port: env.HUSHIAR_MQTT_PORT,
    username: env.HUSHIAR_MQTT_USERNAME,
    password: env.HUSHIAR_MQTT_PASSWORD,
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
  const logManager = new LogManager(LogModel, influxProvider);
  const mqttManager = new MqttManager(mqttProvider);
  const commandManager = new CommandManager(CommandModel);

  // MQTT: register callback — device sends its manufactureId to get a token
  mqttManager.setRegisterDeviceCallback(async (message: Buffer) => {
    const manufactureId = message.toString().trim();
    try {
      const result = await deviceManager.registerDeviceToken(manufactureId);
      if (!result) {
        console.error(`Register via MQTT: no device found for manufactureId ${manufactureId}`);
        return;
      }
      const device = await deviceManager.getByManufactureId(manufactureId);
      if (!device) return;

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
    } catch (err) {
      console.error('MQTT register error:', err);
    }
  });

  // MQTT: uploadImage callback — device sends an image buffer
  mqttManager.setUploadImageCallback(async (token: string, imageBuffer: Buffer) => {
    try {
      const device = await deviceManager.getByToken(token);
      if (!device) {
        console.error(`Upload via MQTT: no device found for token ${token}`);
        return;
      }
      if (!device.user) {
        console.error(`Upload via MQTT: device ${device._id} has no user assigned`);
        return;
      }
      const userId = device.user.toString();
      const deviceId = device._id.toString();
      const actuator = await actuatorManager.getByDeviceAndType(device._id, 'Capture');
      if (!actuator) {
        console.error(`Upload via MQTT: no Capture actuator for device ${deviceId}`);
        return;
      }
      const fileName = await imageManager.storeImage(userId, deviceId, imageBuffer);
      const savedImage = await imageManager.create(device._id, actuator._id, fileName);
      await logManager.ingestImageCaptured(device._id, savedImage._id).catch(console.error);
    } catch (err) {
      console.error('MQTT uploadImage error:', err);
    }
  });

  // MQTT: moving callback — PIR sensor reports motion
  mqttManager.setMovingCallback(async (_topic, isMoving: boolean) => {
    try {
      const token = _topic.token;
      if (!token) return;
      const device = await deviceManager.getByToken(token);
      if (!device) {
        console.error(`Moving via MQTT: no device found for token ${token}`);
        return;
      }
      if (isMoving && device.status !== 'home') {
        await logManager.ingestMoving(device._id).catch(console.error);
      }
    } catch (err) {
      console.error('MQTT moving error:', err);
    }
  });

  return {
    mqttProvider,
    influxProvider,
    deviceManager,
    sensorManager,
    actuatorManager,
    imageManager,
    logManager,
    mqttManager,
    commandManager,
  };
}
