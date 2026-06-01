import type { IActuatorModel } from '@hushiar/db-schema';
import type { IActuator } from '@hushiar/shared-types';
import type { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export class ActuatorManager {
  constructor(private readonly actuatorModel: IActuatorModel) {}

  async add(type: string, status?: string): Promise<IActuator & { _id: Types.ObjectId }> {
    const doc = new this.actuatorModel({
      registerDate: new Date(),
      manufactureId: uuidv4(),
      type,
      status,
    });
    return doc.save() as unknown as IActuator & { _id: Types.ObjectId };
  }

  async addAndAttach(
    type: string,
    deviceId: Types.ObjectId,
  ): Promise<IActuator & { _id: Types.ObjectId }> {
    const doc = new this.actuatorModel({
      registerDate: new Date(),
      manufactureId: uuidv4(),
      type,
      device: deviceId,
      status: 'attached',
    });
    return doc.save() as unknown as IActuator & { _id: Types.ObjectId };
  }

  async assignDevice(
    manufactureId: string,
    deviceId: Types.ObjectId,
  ): Promise<IActuator & { _id: Types.ObjectId }> {
    return this.actuatorModel.findOneAndUpdate(
      { manufactureId },
      { device: deviceId },
      { new: true },
    ) as unknown as IActuator & { _id: Types.ObjectId };
  }

  async getAllByDevice(deviceId: Types.ObjectId): Promise<(IActuator & { _id: Types.ObjectId })[]> {
    return this.actuatorModel
      .find({ device: deviceId })
      .populate('device') as unknown as (IActuator & { _id: Types.ObjectId })[];
  }

  async getByManufactureIdAndDevice(
    deviceId: Types.ObjectId,
    manufactureId: string,
  ): Promise<(IActuator & { _id: Types.ObjectId }) | null> {
    return this.actuatorModel.findOne({
      device: deviceId,
      manufactureId,
    }) as unknown as (IActuator & { _id: Types.ObjectId }) | null;
  }

  async getByDeviceAndType(
    deviceId: Types.ObjectId,
    type: string,
  ): Promise<(IActuator & { _id: Types.ObjectId }) | null> {
    return this.actuatorModel.findOne({
      device: deviceId,
      type,
    }) as unknown as (IActuator & { _id: Types.ObjectId }) | null;
  }

  async getById(
    deviceId: Types.ObjectId,
    actuatorId: Types.ObjectId,
  ): Promise<(IActuator & { _id: Types.ObjectId }) | null> {
    return this.actuatorModel
      .findOne({ device: deviceId, _id: actuatorId })
      .populate('device') as unknown as (IActuator & { _id: Types.ObjectId }) | null;
  }

  async setIsActive(
    deviceId: Types.ObjectId,
    actuatorId: Types.ObjectId,
    isActive: boolean,
  ): Promise<void> {
    await this.actuatorModel.findOneAndUpdate({ _id: actuatorId, device: deviceId }, { isActive });
  }
}
