import type { IDeviceTypeModel } from '@hushiar/db-schema';
import type { IDeviceType } from '@hushiar/shared-types';

export class DeviceTypeManager {
  constructor(private readonly deviceTypeModel: IDeviceTypeModel) {}

  async getAll(): Promise<(IDeviceType & { _id: unknown })[]> {
    return this.deviceTypeModel.find({}) as unknown as (IDeviceType & { _id: unknown })[];
  }
}
