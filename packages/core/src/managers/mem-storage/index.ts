import type { RedisProvider } from '@hushiar/providers';
import type { Types } from 'mongoose';

export class MemStorageManager {
  constructor(private readonly redisProvider: RedisProvider) {}

  async setDeviceLastImage(
    deviceId: Types.ObjectId,
    actuatorId: Types.ObjectId,
    imageData: unknown,
  ): Promise<void> {
    const key = `${deviceId.toString()}_${actuatorId.toString()}`;
    await this.redisProvider.set(key, JSON.stringify(imageData));
  }

  async getDeviceLastImage(deviceId: Types.ObjectId, actuatorId: Types.ObjectId): Promise<unknown> {
    const key = `${deviceId.toString()}_${actuatorId.toString()}`;
    const value = await this.redisProvider.get(key);
    if (!value) return null;
    return JSON.parse(value) as unknown;
  }
}
