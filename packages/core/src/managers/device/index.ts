import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { IDeviceModel } from '@hushiar/db-schema';
import type { IDevice, IDevicePopulated } from '@hushiar/shared-types';
import type { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.MQTT_PASSWORD_ENCRYPTION_KEY;
  if (!key) throw new Error('MQTT_PASSWORD_ENCRYPTION_KEY is not set');
  return Buffer.from(key.padEnd(32, '0').slice(0, 32));
}

function encrypt(text: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(ciphertext: string): string {
  const [ivHex, encHex] = ciphertext.split(':');
  const iv = Buffer.from(ivHex!, 'hex');
  const encrypted = Buffer.from(encHex!, 'hex');
  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

function randomSecret(): string {
  const chars = [
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    '0123456789!~$&*_=+-',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  ];
  const parts = [4, 4, 4].map((len, i) =>
    Array.from({ length: len }, () => {
      const pool = chars[i]!;
      return pool[Math.floor(Math.random() * pool.length)];
    }).join(''),
  );
  return parts
    .join('')
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
}

export class DeviceManager {
  constructor(private readonly deviceModel: IDeviceModel) {}

  async add(
    title: string,
    type: string,
    status: string,
  ): Promise<IDevice & { _id: Types.ObjectId }> {
    const mqttPassword = randomSecret();
    const doc = new this.deviceModel({
      manufactureId: uuidv4(),
      type,
      registerDate: new Date(),
      status,
      title,
      mqttUserName: randomSecret(),
      mqttPassword: encrypt(mqttPassword),
    });
    return doc.save() as unknown as IDevice & { _id: Types.ObjectId };
  }

  async getAll(): Promise<IDevicePopulated[]> {
    return this.deviceModel
      .find({})
      .populate('user')
      .populate('location') as unknown as IDevicePopulated[];
  }

  async getAllByUser(userId: string): Promise<IDevicePopulated[]> {
    return this.deviceModel
      .find({ user: userId })
      .populate('user')
      .populate('location') as unknown as IDevicePopulated[];
  }

  async getByUser(
    userId: string,
    deviceId: string,
  ): Promise<(IDevice & { _id: Types.ObjectId }) | null> {
    return this.deviceModel.findOne({
      _id: deviceId,
      user: userId,
    }) as unknown as (IDevice & { _id: Types.ObjectId }) | null;
  }

  async getByManufactureId(
    manufactureId: string,
  ): Promise<(IDevice & { _id: Types.ObjectId }) | null> {
    return this.deviceModel.findOne({ manufactureId }).populate('user') as unknown as
      | (IDevice & { _id: Types.ObjectId })
      | null;
  }

  async getByToken(token: string): Promise<(IDevice & { _id: Types.ObjectId }) | null> {
    return this.deviceModel.findOne({ token }).populate('user') as unknown as
      | (IDevice & { _id: Types.ObjectId })
      | null;
  }

  async setup(
    userId: string,
    manufactureId: string,
  ): Promise<(IDevice & { _id: Types.ObjectId }) | null> {
    return this.deviceModel.findOneAndUpdate(
      { manufactureId },
      { user: userId },
      { new: true },
    ) as unknown as (IDevice & { _id: Types.ObjectId }) | null;
  }

  async assignLocation(
    location: Types.ObjectId,
    manufactureId: string,
  ): Promise<(IDevice & { _id: Types.ObjectId }) | null> {
    return this.deviceModel.findOneAndUpdate(
      { manufactureId },
      { location },
      { new: true },
    ) as unknown as (IDevice & { _id: Types.ObjectId }) | null;
  }

  async setInfo(
    deviceId: string,
    title: string,
    location: Types.ObjectId,
  ): Promise<(IDevice & { _id: Types.ObjectId }) | null> {
    return this.deviceModel.findByIdAndUpdate(
      deviceId,
      { title, location },
      { new: true },
    ) as unknown as (IDevice & { _id: Types.ObjectId }) | null;
  }

  async setStatus(
    deviceId: Types.ObjectId,
    status: string,
  ): Promise<(IDevice & { _id: Types.ObjectId }) | null> {
    return this.deviceModel.findByIdAndUpdate(deviceId, { status }, { new: true }) as unknown as
      | (IDevice & { _id: Types.ObjectId })
      | null;
  }

  async setOnAlarm(deviceId: Types.ObjectId, isOnAlarm: boolean): Promise<void> {
    await this.deviceModel.findByIdAndUpdate(deviceId, { isOnAlarm });
  }

  async setOnAlarmByManufactureId(manufactureId: string, isOnAlarm: boolean): Promise<void> {
    await this.deviceModel.findOneAndUpdate({ manufactureId }, { isOnAlarm });
  }

  async setIsMonitoring(deviceId: Types.ObjectId, isMonitoring: boolean): Promise<void> {
    await this.deviceModel.findByIdAndUpdate(deviceId, { isMonitoring });
  }

  async setMovingStatus(deviceId: Types.ObjectId, isMoving: boolean): Promise<void> {
    await this.deviceModel.findByIdAndUpdate(deviceId, { isMoving });
  }

  async setNewStatus(
    deviceId: Types.ObjectId,
    isMoving: boolean,
    isOnAlarm: boolean,
    isLightOn: boolean,
    temperature: number,
  ): Promise<void> {
    await this.deviceModel.findByIdAndUpdate(deviceId, {
      isMoving,
      isOnAlarm,
      isLightOn,
      temperature,
    });
  }

  async registerDeviceToken(
    manufactureId: string,
  ): Promise<{ token: string; mqttBroker: string } | null> {
    const token = uuidv4();
    const device = await this.deviceModel.findOneAndUpdate(
      { manufactureId },
      { token },
      { new: true },
    );
    if (!device) return null;
    return {
      token,
      mqttBroker: process.env.HUSHIAR_MQTT_HOST ?? 'mqtt.hushiar.com',
    };
  }

  decryptMqttPassword(encryptedPassword: string): string {
    return decrypt(encryptedPassword);
  }
}
