import type { ILocationModel } from '@hushiar/db-schema';
import type { ILocation } from '@hushiar/shared-types';
import type { Types } from 'mongoose';

export class LocationManager {
  constructor(private readonly locationModel: ILocationModel) {}

  async getAllByUser(userId: Types.ObjectId): Promise<(ILocation & { _id: Types.ObjectId })[]> {
    return this.locationModel.find({ user: userId }) as unknown as (ILocation & {
      _id: Types.ObjectId;
    })[];
  }

  async add(
    userId: Types.ObjectId,
    title: string,
    address?: string,
  ): Promise<ILocation & { _id: Types.ObjectId }> {
    const doc = new this.locationModel({
      user: userId,
      title,
      address,
      registerDate: new Date(),
    });
    return doc.save() as unknown as ILocation & { _id: Types.ObjectId };
  }

  async remove(locationId: Types.ObjectId): Promise<void> {
    await this.locationModel.findByIdAndDelete(locationId);
  }
}
