import type { ISensorModel } from '@hushiar/db-schema';
import type { ISensor } from '@hushiar/shared-types';
import type { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export class SensorManager {
  constructor(private readonly sensorModel: ISensorModel) {}

  async add(type: string, status?: string): Promise<ISensor & { _id: Types.ObjectId }> {
    const doc = new this.sensorModel({
      registerDate: new Date(),
      manufactureId: uuidv4(),
      type,
      status,
    });
    return doc.save() as unknown as ISensor & { _id: Types.ObjectId };
  }

  async addAndAttach(
    type: string,
    deviceId: Types.ObjectId,
  ): Promise<ISensor & { _id: Types.ObjectId }> {
    const doc = new this.sensorModel({
      registerDate: new Date(),
      manufactureId: uuidv4(),
      type,
      device: deviceId,
      status: 'attached',
    });
    return doc.save() as unknown as ISensor & { _id: Types.ObjectId };
  }

  async attach(
    manufactureId: string,
    deviceId: Types.ObjectId,
  ): Promise<ISensor & { _id: Types.ObjectId }> {
    return this.sensorModel.findOneAndUpdate(
      { manufactureId },
      { device: deviceId, status: 'attached' },
      { new: true },
    ) as unknown as ISensor & { _id: Types.ObjectId };
  }

  async detach(
    manufactureId: string,
    deviceId: Types.ObjectId,
  ): Promise<ISensor & { _id: Types.ObjectId }> {
    return this.sensorModel.findOneAndUpdate(
      { manufactureId, device: deviceId },
      { $unset: { device: '' }, status: 'detached' },
      { new: true },
    ) as unknown as ISensor & { _id: Types.ObjectId };
  }

  async getByManufactureId(
    manufactureId: string,
  ): Promise<(ISensor & { _id: Types.ObjectId }) | null> {
    return this.sensorModel.findOne({ manufactureId }) as unknown as
      | (ISensor & { _id: Types.ObjectId })
      | null;
  }

  async getAllByDevice(deviceId: Types.ObjectId): Promise<(ISensor & { _id: Types.ObjectId })[]> {
    return this.sensorModel.find({ device: deviceId }).populate('device') as unknown as (ISensor & {
      _id: Types.ObjectId;
    })[];
  }

  async getByDeviceAndType(
    deviceId: Types.ObjectId,
    type: string,
  ): Promise<(ISensor & { _id: Types.ObjectId }) | null> {
    return this.sensorModel.findOne({
      device: deviceId,
      type,
    }) as unknown as (ISensor & { _id: Types.ObjectId }) | null;
  }

  async setIsActive(
    deviceId: Types.ObjectId,
    sensorId: Types.ObjectId,
    isActive: boolean,
  ): Promise<void> {
    await this.sensorModel.findOneAndUpdate({ _id: sensorId, device: deviceId }, { isActive });
  }
}
