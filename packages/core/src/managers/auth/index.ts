import type { IAuthModel } from '@hushiar/db-schema';
import type { IAuth } from '@hushiar/shared-types';
import type { Types } from 'mongoose';

export class AuthManager {
  constructor(private readonly authModel: IAuthModel) {}

  async createForUser(userId: Types.ObjectId): Promise<IAuth & { _id: Types.ObjectId }> {
    const doc = new this.authModel({
      authToken: Math.floor(Math.random() * (99999 - 10000 + 1) + 10000),
      createDate: new Date(),
      user: userId,
    });
    return doc.save() as unknown as IAuth & { _id: Types.ObjectId };
  }

  async getById(id: Types.ObjectId): Promise<(IAuth & { _id: Types.ObjectId }) | null> {
    return this.authModel.findOne({ _id: id }).populate('user') as unknown as
      | (IAuth & { _id: Types.ObjectId })
      | null;
  }

  async getByUser(userId: Types.ObjectId): Promise<(IAuth & { _id: Types.ObjectId }) | null> {
    return this.authModel.findOne({ user: userId }).populate('user') as unknown as
      | (IAuth & { _id: Types.ObjectId })
      | null;
  }

  async getByUserAndToken(
    userId: Types.ObjectId,
    authToken: number,
  ): Promise<(IAuth & { _id: Types.ObjectId }) | null> {
    return this.authModel.findOne({
      user: userId,
      authToken,
    }) as unknown as (IAuth & { _id: Types.ObjectId }) | null;
  }

  async revokeToken(
    auth: IAuth & { _id: Types.ObjectId },
  ): Promise<IAuth & { _id: Types.ObjectId }> {
    return this.authModel.findByIdAndUpdate(
      auth._id,
      {
        authToken: Math.floor(Math.random() * (99999 - 10000 + 1) + 10000),
        createDate: new Date(),
      },
      { new: true },
    ) as unknown as IAuth & { _id: Types.ObjectId };
  }
}
