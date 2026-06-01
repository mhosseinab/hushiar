import type { ICommandModel } from '@hushiar/db-schema';
import type { ICommand } from '@hushiar/shared-types';
import type { Types } from 'mongoose';

export class CommandManager {
  constructor(private readonly commandModel: ICommandModel) {}

  async create(
    deviceId: Types.ObjectId,
    command: string,
    actuatorId?: Types.ObjectId,
    sensorId?: Types.ObjectId,
  ): Promise<ICommand & { _id: Types.ObjectId }> {
    const doc = new this.commandModel({
      registerDate: new Date(),
      device: deviceId,
      actuator: actuatorId,
      sensor: sensorId,
      command,
      isDone: false,
    });
    return doc.save() as unknown as ICommand & { _id: Types.ObjectId };
  }

  async createForDevice(
    deviceId: Types.ObjectId,
    command: string,
  ): Promise<ICommand & { _id: Types.ObjectId }> {
    return this.create(deviceId, command);
  }

  async getAllByDeviceAndStatus(
    deviceId: Types.ObjectId,
    isDone: boolean,
  ): Promise<(ICommand & { _id: Types.ObjectId })[]> {
    return this.commandModel
      .find({ device: deviceId, isDone })
      .populate('device sensor actuator') as unknown as (ICommand & { _id: Types.ObjectId })[];
  }

  async setExecutionResult(
    deviceId: Types.ObjectId,
    commandId: Types.ObjectId,
    isDone: boolean,
  ): Promise<void> {
    await this.commandModel.findOneAndUpdate(
      { _id: commandId, device: deviceId },
      { isDone },
      { new: true },
    );
  }
}
