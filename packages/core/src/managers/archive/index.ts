import { rm } from 'node:fs/promises';
import type { IArchiveModel } from '@hushiar/db-schema';
import type { IArchive } from '@hushiar/shared-types';
import type { Types } from 'mongoose';

export class ArchiveManager {
  private readonly videoStoragePath: string;

  constructor(
    private readonly archiveModel: IArchiveModel,
    videoStoragePath?: string,
  ) {
    this.videoStoragePath =
      videoStoragePath ?? process.env.CAMERA_VIDEO_STORAGE_PATH ?? './storage/video';
  }

  getVideoPath(userId: string, deviceId: string, fileName: string): string {
    return `${this.videoStoragePath}/${userId}/${deviceId}/${fileName}`;
  }

  async startMoving(
    deviceId: Types.ObjectId,
    sensorId: Types.ObjectId,
  ): Promise<IArchive & { _id: Types.ObjectId }> {
    await this.archiveModel.updateMany(
      { device: deviceId, sensor: sensorId, endDate: { $exists: false }, isMoving: true },
      { endDate: new Date() },
    );
    const doc = new this.archiveModel({
      device: deviceId,
      sensor: sensorId,
      startDate: new Date(),
      isMoving: true,
    });
    return doc.save() as unknown as IArchive & { _id: Types.ObjectId };
  }

  async endMoving(
    deviceId: Types.ObjectId,
    sensorId: Types.ObjectId,
  ): Promise<(IArchive & { _id: Types.ObjectId }) | null> {
    return this.archiveModel.findOneAndUpdate(
      { device: deviceId, sensor: sensorId, endDate: { $exists: false }, isMoving: true },
      { endDate: new Date() },
      { new: true },
    ) as unknown as (IArchive & { _id: Types.ObjectId }) | null;
  }

  async completedWithService(
    deviceId: Types.ObjectId,
    startDate: Date,
    endDate: Date,
    videoFileName: string,
    imageList: Types.ObjectId[],
  ): Promise<IArchive & { _id: Types.ObjectId }> {
    const doc = new this.archiveModel({
      device: deviceId,
      startDate,
      endDate,
      isMoving: false,
      videoFileName,
      imageList,
    });
    return doc.save() as unknown as IArchive & { _id: Types.ObjectId };
  }

  async get(archiveId: Types.ObjectId): Promise<(IArchive & { _id: Types.ObjectId }) | null> {
    return this.archiveModel
      .findById(archiveId)
      .populate('sensor')
      .populate('device')
      .populate('imageList') as unknown as (IArchive & { _id: Types.ObjectId }) | null;
  }

  async getAllByDevice(deviceId: Types.ObjectId): Promise<(IArchive & { _id: Types.ObjectId })[]> {
    return this.archiveModel
      .find({ device: deviceId })
      .sort({ startDate: -1 })
      .limit(20)
      .populate('sensor')
      .populate('device')
      .populate('imageList') as unknown as (IArchive & { _id: Types.ObjectId })[];
  }

  async getAllVideoByDevice(
    deviceId: Types.ObjectId,
  ): Promise<(IArchive & { _id: Types.ObjectId })[]> {
    return this.archiveModel
      .find({ device: deviceId, videoFileName: { $ne: null } })
      .sort({ startDate: -1 })
      .limit(50)
      .populate('sensor')
      .populate('device')
      .populate('imageList') as unknown as (IArchive & { _id: Types.ObjectId })[];
  }

  async getAllByDeviceList(
    deviceIds: Types.ObjectId[],
  ): Promise<(IArchive & { _id: Types.ObjectId })[]> {
    return this.archiveModel
      .find({ device: { $in: deviceIds } })
      .sort({ startDate: -1 })
      .limit(20)
      .populate('sensor') as unknown as (IArchive & { _id: Types.ObjectId })[];
  }

  async setVideoFileName(
    archiveId: Types.ObjectId,
    videoFileName: string,
  ): Promise<(IArchive & { _id: Types.ObjectId }) | null> {
    return this.archiveModel.findByIdAndUpdate(
      archiveId,
      { videoFileName },
      { new: true },
    ) as unknown as (IArchive & { _id: Types.ObjectId }) | null;
  }

  async deleteByDeviceAndId(
    userId: string,
    deviceId: Types.ObjectId,
    archiveId: Types.ObjectId,
  ): Promise<(IArchive & { _id: Types.ObjectId }) | null> {
    const deleted = (await this.archiveModel.findOneAndDelete({
      _id: archiveId,
      device: deviceId,
    })) as unknown as (IArchive & { _id: Types.ObjectId }) | null;

    if (deleted?.videoFileName) {
      const filePath = this.getVideoPath(userId, deviceId.toString(), deleted.videoFileName);
      await rm(filePath, { force: true });
    }

    return deleted;
  }

  async removeByDevice(deviceId: Types.ObjectId): Promise<void> {
    await this.archiveModel.deleteMany({ device: deviceId });
  }
}
