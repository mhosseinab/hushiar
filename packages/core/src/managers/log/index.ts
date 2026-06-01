import type { ILogModel } from '@hushiar/db-schema';
import type { InfluxProvider } from '@hushiar/providers';
import type { ILog } from '@hushiar/shared-types';
import type { Types } from 'mongoose';

export class LogManager {
  constructor(
    private readonly logModel: ILogModel,
    private readonly influxProvider: InfluxProvider,
  ) {}

  private async ingest(
    deviceId: Types.ObjectId,
    logData: unknown,
    type: string,
  ): Promise<ILog & { _id: Types.ObjectId }> {
    const doc = new this.logModel({
      type,
      registerDate: new Date(),
      device: deviceId,
      logData,
    });
    return doc.save() as unknown as ILog & { _id: Types.ObjectId };
  }

  async ingestMoving(deviceId: Types.ObjectId): Promise<ILog & { _id: Types.ObjectId }> {
    void this.influxProvider.writeBoolean('movement', deviceId.toString(), 'moving', 'true');
    return this.ingest(deviceId, { type: 'moving' }, 'moving');
  }

  async ingestImageCaptured(
    deviceId: Types.ObjectId,
    imageId: Types.ObjectId,
  ): Promise<ILog & { _id: Types.ObjectId }> {
    void this.influxProvider.writeBoolean('captureImage', deviceId.toString(), 'capturing', 'true');
    return this.ingest(deviceId, { type: 'imageCaptured', imageId }, 'imageCaptured');
  }

  async ingestDeviceStatusChanged(
    deviceId: Types.ObjectId,
    status: string,
  ): Promise<ILog & { _id: Types.ObjectId }> {
    void this.influxProvider.writeString('changeMode', deviceId.toString(), 'status', status);
    return this.ingest(deviceId, { type: 'changeMode', deviceStatus: status }, 'changeMode');
  }

  async ingestVideoArchived(
    deviceId: Types.ObjectId,
    archiveId: Types.ObjectId,
  ): Promise<ILog & { _id: Types.ObjectId }> {
    return this.ingest(deviceId, { type: 'videoArchive', archiveId }, 'videoArchive');
  }

  async ingestGetToken(deviceId: Types.ObjectId): Promise<ILog & { _id: Types.ObjectId }> {
    void this.influxProvider.writeBoolean('registration', deviceId.toString(), 'getToken', 'true');
    return this.ingest(deviceId, { type: 'getToken' }, 'getToken');
  }

  async ingestAddSubscriber(
    deviceId: Types.ObjectId,
    title: string,
  ): Promise<ILog & { _id: Types.ObjectId }> {
    return this.ingest(deviceId, { type: 'addSubscriber', title }, 'addSubscriber');
  }

  async ingestLog(
    deviceId: Types.ObjectId,
    type: string,
    logData: unknown,
  ): Promise<ILog & { _id: Types.ObjectId }> {
    return this.ingest(deviceId, logData, type);
  }

  async getAllByDevice(deviceId: Types.ObjectId): Promise<(ILog & { _id: Types.ObjectId })[]> {
    return this.logModel
      .find({ device: deviceId, type: { $nin: ['imageCaptured'] } })
      .sort({ registerDate: -1 })
      .limit(40) as unknown as (ILog & { _id: Types.ObjectId })[];
  }

  async getAllByDeviceList(
    deviceIds: Types.ObjectId[],
  ): Promise<(ILog & { _id: Types.ObjectId })[]> {
    return this.logModel
      .find({ device: { $in: deviceIds } })
      .sort({ registerDate: -1 })
      .limit(40) as unknown as (ILog & { _id: Types.ObjectId })[];
  }

  async removeByDevice(deviceId: Types.ObjectId): Promise<void> {
    await this.logModel.deleteMany({ device: deviceId });
  }
}
