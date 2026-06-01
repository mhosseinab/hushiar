import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import type { IImageModel } from '@hushiar/db-schema';
import type { IImage } from '@hushiar/shared-types';
import type { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

interface LastImageEntry {
  deviceId: Types.ObjectId;
  actuatorId: Types.ObjectId;
  imageId: Types.ObjectId;
  fileName: string;
}

export class ImageManager {
  private readonly storagePath: string;
  private lastImageCache: LastImageEntry[] = [];

  constructor(
    private readonly imageModel: IImageModel,
    storagePath?: string,
  ) {
    this.storagePath = storagePath ?? process.env.CAMERA_IMAGE_STORAGE_PATH ?? './storage/images';
  }

  getImagePath(userId: string, deviceId: string, fileName: string): string {
    return `${this.storagePath}/${userId}/${deviceId}/${fileName}`;
  }

  async storeImage(userId: string, deviceId: string, imageBuffer: Buffer): Promise<string> {
    const fileName = `${uuidv4()}.jpg`;
    const userDir = `${this.storagePath}/${userId}`;
    const deviceDir = `${userDir}/${deviceId}`;

    if (!existsSync(userDir)) {
      await mkdir(userDir, { recursive: true });
    } else if (!existsSync(deviceDir)) {
      await mkdir(deviceDir, { recursive: true });
    }

    await writeFile(this.getImagePath(userId, deviceId, fileName), imageBuffer, 'binary');
    return fileName;
  }

  async create(
    deviceId: Types.ObjectId,
    actuatorId: Types.ObjectId,
    fileName: string,
    file?: unknown,
  ): Promise<IImage & { _id: Types.ObjectId }> {
    const doc = new this.imageModel({
      registerDate: new Date(),
      device: deviceId,
      actuator: actuatorId,
      file,
      fileName,
    });
    return doc.save() as unknown as IImage & { _id: Types.ObjectId };
  }

  setDeviceLastImage(entry: LastImageEntry): void {
    this.lastImageCache = this.lastImageCache.filter(
      (e) =>
        e.deviceId.toString() !== entry.deviceId.toString() ||
        e.actuatorId.toString() !== entry.actuatorId.toString(),
    );
    this.lastImageCache.push(entry);
  }

  getDeviceLastImage(
    deviceId: Types.ObjectId,
    actuatorId: Types.ObjectId,
  ): LastImageEntry | undefined {
    return this.lastImageCache.find(
      (e) =>
        e.deviceId.toString() === deviceId.toString() &&
        e.actuatorId.toString() === actuatorId.toString(),
    );
  }

  async getLatestByDeviceAndActuator(
    deviceId: Types.ObjectId,
    actuatorId: Types.ObjectId,
  ): Promise<(IImage & { _id: Types.ObjectId }) | null> {
    return this.imageModel
      .findOne({ device: deviceId, actuator: actuatorId })
      .sort({ registerDate: -1 })
      .populate('device')
      .populate('actuator') as unknown as (IImage & { _id: Types.ObjectId }) | null;
  }

  async getAllByDevice(deviceId: Types.ObjectId): Promise<(IImage & { _id: Types.ObjectId })[]> {
    return this.imageModel
      .find({ device: deviceId })
      .sort({ registerDate: -1 })
      .limit(20)
      .populate('device')
      .populate('actuator') as unknown as (IImage & { _id: Types.ObjectId })[];
  }

  async getAllByDeviceAndTimeRange(
    deviceId: Types.ObjectId,
    fromDate: Date,
    toDate: Date,
  ): Promise<(IImage & { _id: Types.ObjectId })[]> {
    return this.imageModel
      .find({
        device: deviceId,
        registerDate: { $gte: fromDate, $lte: toDate },
      })
      .sort({ registerDate: 1 })
      .populate('device')
      .populate('actuator') as unknown as (IImage & { _id: Types.ObjectId })[];
  }

  async getById(
    deviceId: Types.ObjectId,
    imageId: Types.ObjectId,
  ): Promise<(IImage & { _id: Types.ObjectId }) | null> {
    return this.imageModel
      .findOne({ device: deviceId, _id: imageId })
      .populate('device')
      .populate('actuator') as unknown as (IImage & { _id: Types.ObjectId }) | null;
  }

  async getBase64FromPath(filePath: string): Promise<string> {
    const content = await readFile(filePath, { encoding: 'base64' });
    return content;
  }

  async deleteByDeviceAndId(
    userId: string,
    deviceId: Types.ObjectId,
    imageId: Types.ObjectId,
  ): Promise<(IImage & { _id: Types.ObjectId }) | null> {
    const deleted = (await this.imageModel.findOneAndDelete({
      _id: imageId,
      device: deviceId,
    })) as unknown as (IImage & { _id: Types.ObjectId }) | null;

    if (deleted?.fileName) {
      const filePath = this.getImagePath(userId, deviceId.toString(), deleted.fileName);
      await rm(filePath, { force: true });
    }

    return deleted;
  }

  async removeByDevice(deviceId: Types.ObjectId): Promise<void> {
    await this.imageModel.deleteMany({ device: deviceId });
  }
}
