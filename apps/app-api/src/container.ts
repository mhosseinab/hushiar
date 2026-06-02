import {
  ActuatorManager,
  ArchiveManager,
  AuthManager,
  CommandManager,
  DeviceManager,
  DeviceTypeManager,
  ImageManager,
  LocationManager,
  LogManager,
  MqttManager,
  NotifyManager,
  SensorManager,
  SocketManager,
  StorageManager,
  SubscriberManager,
  UserManager,
  VideoManager,
} from '@hushiar/core';
import {
  ActuatorModel,
  ArchiveModel,
  AuthModel,
  CommandModel,
  DeviceModel,
  DeviceTypeModel,
  ImageModel,
  LocationModel,
  LogModel,
  SensorModel,
  SubscriberModel,
  UserModel,
} from '@hushiar/db-schema';
import {
  InfluxProvider,
  MqttProvider,
  RedisProvider,
  SmsProvider,
  WebPushProvider,
} from '@hushiar/providers';
import { z } from 'zod';

const envSchema = z.object({
  MONGO_URI: z.string().min(1),
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.string().transform(Number),
  INFLUX_URL: z.string().min(1),
  INFLUX_TOKEN: z.string().min(1),
  INFLUX_ORG: z.string().min(1),
  INFLUX_BUCKET: z.string().min(1),
  VAPID_PUBLIC_KEY: z.string().min(1),
  VAPID_PRIVATE_KEY: z.string().min(1),
  VAPID_EMAIL: z.string().min(1),
  KAVENEGAR_API_KEY: z.string().min(1),
  HUSHIAR_MQTT_HOST: z.string().min(1),
  HUSHIAR_MQTT_PORT: z.string().transform(Number),
  HUSHIAR_MQTT_USERNAME: z.string().min(1),
  HUSHIAR_MQTT_PASSWORD: z.string().min(1),
  ARCHIVE_VIDEO_DURATION_MIN: z.string().optional(),
  CAMERA_IMAGE_STORAGE_PATH: z.string().optional(),
  CAMERA_VIDEO_STORAGE_PATH: z.string().optional(),
  MQTT_PASSWORD_ENCRYPTION_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.format());
    process.exit(1);
  }
  return result.data;
}

export interface Container {
  env: Env;
  userManager: UserManager;
  deviceManager: DeviceManager;
  locationManager: LocationManager;
  sensorManager: SensorManager;
  actuatorManager: ActuatorManager;
  imageManager: ImageManager;
  archiveManager: ArchiveManager;
  logManager: LogManager;
  authManager: AuthManager;
  notifyManager: NotifyManager;
  socketManager: SocketManager;
  mqttManager: MqttManager;
  storageManager: StorageManager;
  deviceTypeManager: DeviceTypeManager;
  subscriberManager: SubscriberManager;
  videoManager: VideoManager;
  commandManager: CommandManager;
}

export function createContainer(): Container {
  const env = parseEnv();

  // Providers
  const redisProvider = new RedisProvider(`redis://${env.REDIS_HOST}:${env.REDIS_PORT}`);

  const influxProvider = new InfluxProvider({
    url: env.INFLUX_URL,
    token: env.INFLUX_TOKEN,
    org: env.INFLUX_ORG,
    bucket: env.INFLUX_BUCKET,
  });

  const mqttProvider = new MqttProvider({
    host: env.HUSHIAR_MQTT_HOST,
    port: env.HUSHIAR_MQTT_PORT,
    username: env.HUSHIAR_MQTT_USERNAME,
    password: env.HUSHIAR_MQTT_PASSWORD,
  });

  const smsProvider = new SmsProvider(env.KAVENEGAR_API_KEY);

  const webPushProvider = new WebPushProvider({
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
    email: env.VAPID_EMAIL,
  });

  // Suppress unused warning for providers not directly used in managers here
  void redisProvider;

  // Managers
  const userManager = new UserManager(UserModel, webPushProvider);
  const deviceManager = new DeviceManager(DeviceModel);
  const locationManager = new LocationManager(LocationModel);
  const sensorManager = new SensorManager(SensorModel);
  const actuatorManager = new ActuatorManager(ActuatorModel);
  const imageManager = new ImageManager(ImageModel, env.CAMERA_IMAGE_STORAGE_PATH);
  const archiveManager = new ArchiveManager(ArchiveModel, env.CAMERA_VIDEO_STORAGE_PATH);
  const logManager = new LogManager(LogModel, influxProvider);
  const authManager = new AuthManager(AuthModel);
  const notifyManager = new NotifyManager(smsProvider, userManager);
  const socketManager = new SocketManager();
  const mqttManager = new MqttManager(mqttProvider);
  const storageManager = new StorageManager(
    UserModel,
    env.CAMERA_IMAGE_STORAGE_PATH,
    env.CAMERA_VIDEO_STORAGE_PATH,
  );
  const deviceTypeManager = new DeviceTypeManager(DeviceTypeModel);
  const subscriberManager = new SubscriberManager(SubscriberModel);
  const videoManager = new VideoManager(env.CAMERA_VIDEO_STORAGE_PATH);
  const commandManager = new CommandManager(CommandModel);

  return {
    env,
    userManager,
    deviceManager,
    locationManager,
    sensorManager,
    actuatorManager,
    imageManager,
    archiveManager,
    logManager,
    authManager,
    notifyManager,
    socketManager,
    mqttManager,
    storageManager,
    deviceTypeManager,
    subscriberManager,
    videoManager,
    commandManager,
  };
}
