import type { ISubscriberModel } from '@hushiar/db-schema';
import type { ISubscriber } from '@hushiar/shared-types';
import type { Types } from 'mongoose';

export class SubscriberManager {
  constructor(private readonly subscriberModel: ISubscriberModel) {}

  async add(
    deviceId: Types.ObjectId,
    title: string,
    mobileNumber: string,
  ): Promise<ISubscriber & { _id: Types.ObjectId }> {
    const doc = new this.subscriberModel({
      registerDate: new Date(),
      title,
      mobileNumber,
      device: deviceId,
    });
    return doc.save() as unknown as ISubscriber & { _id: Types.ObjectId };
  }

  async getAllByDevice(
    deviceId: Types.ObjectId,
  ): Promise<(ISubscriber & { _id: Types.ObjectId })[]> {
    return this.subscriberModel.find({ device: deviceId }) as unknown as (ISubscriber & {
      _id: Types.ObjectId;
    })[];
  }

  async remove(deviceId: Types.ObjectId, subscriberId: Types.ObjectId): Promise<void> {
    await this.subscriberModel.findOneAndDelete({ _id: subscriberId, device: deviceId });
  }
}
