import type { IUserModel } from '@hushiar/db-schema';
import type { WebPushProvider } from '@hushiar/providers';
import type { IUser, WebPushSubscription } from '@hushiar/shared-types';
import type { Types } from 'mongoose';

interface WebPushPayload {
  notification: {
    title: string;
    body: string;
    icon: string;
    vibrate: number[];
    sound: string;
    data: { dateOfArrival: number; primaryKey: number; url?: string };
    actions?: { action: string; title: string }[];
  };
}

export class UserManager {
  constructor(
    private readonly userModel: IUserModel,
    private readonly webPushProvider: WebPushProvider,
  ) {}

  async create(title: string, mobileNumber: string): Promise<IUser & { _id: Types.ObjectId }> {
    const doc = new this.userModel({
      title,
      mobileNumber,
      registerDate: new Date(),
      isValid: true,
      credit: 1000000,
    });
    return doc.save() as unknown as IUser & { _id: Types.ObjectId };
  }

  async createByMobileNumber(mobileNumber: string): Promise<IUser & { _id: Types.ObjectId }> {
    const doc = new this.userModel({ mobileNumber });
    return doc.save() as unknown as IUser & { _id: Types.ObjectId };
  }

  async get(userId: string): Promise<(IUser & { _id: Types.ObjectId }) | null> {
    return this.userModel.findById(userId) as unknown as (IUser & { _id: Types.ObjectId }) | null;
  }

  async getByMobileNumber(mobileNumber: string): Promise<(IUser & { _id: Types.ObjectId }) | null> {
    return this.userModel.findOne({ mobileNumber }) as unknown as
      | (IUser & { _id: Types.ObjectId })
      | null;
  }

  async getAll(): Promise<(IUser & { _id: Types.ObjectId })[]> {
    return this.userModel.find({}) as unknown as (IUser & { _id: Types.ObjectId })[];
  }

  async updateInfo(
    userId: string,
    title: string,
    email: string,
  ): Promise<(IUser & { _id: Types.ObjectId }) | null> {
    return this.userModel.findByIdAndUpdate(userId, { title, email }, { new: true }) as unknown as
      | (IUser & { _id: Types.ObjectId })
      | null;
  }

  async addWebPushSub(
    userId: string,
    sub: WebPushSubscription,
  ): Promise<(IUser & { _id: Types.ObjectId }) | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $push: { wpSubList: sub } },
      { new: true },
    ) as unknown as (IUser & { _id: Types.ObjectId }) | null;
  }

  async validateMobileNumber(userId: string): Promise<(IUser & { _id: Types.ObjectId }) | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $set: { isMobileNumberConfirmed: true } },
      { new: true },
    ) as unknown as (IUser & { _id: Types.ObjectId }) | null;
  }

  async setLastWPDateTime(userId: Types.ObjectId, date: Date): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { lastWPDateTime: date });
  }

  async setLastSMSDateTime(userId: Types.ObjectId, date: Date): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { lastSMSDateTime: date });
  }

  async setStorageUsage(
    userId: Types.ObjectId,
    usedSize: number,
    remainedSize: number,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      storageUsedSize: usedSize,
      storageRemainedSize: remainedSize,
    });
  }

  async setStorageMaxSize(userId: string, maxSize: number): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { storageMaxSize: maxSize });
  }

  async setRemainingDays(userId: string, days: number): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { remainingDays: days });
  }

  async updateRemainingDays(userId: Types.ObjectId, delta: number): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { $inc: { remainingDays: delta } });
  }

  async deductRemainingDays(): Promise<void> {
    const users = await this.userModel.find({ isValid: true, remainingDays: { $gt: 0 } });
    await Promise.allSettled(
      users.map((user) =>
        this.userModel.findByIdAndUpdate(user._id, { $inc: { remainingDays: -1 } }),
      ),
    );
  }

  async webPushNotify(
    userId: Types.ObjectId,
    deviceTitle: string,
    deviceId: Types.ObjectId,
  ): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user?.wpSubList?.length) return;

    const lastWP = user.lastWPDateTime;
    const secondsSinceLast = lastWP
      ? (Date.now() - new Date(lastWP).getTime()) / 1000
      : Number.POSITIVE_INFINITY;

    if (secondsSinceLast <= 60) return;

    await this.setLastWPDateTime(userId, new Date());

    const payload: WebPushPayload = {
      notification: {
        title: 'اخطار',
        body: `تشخیص حرکت در ${deviceTitle}`,
        icon: 'https://cdn.hushiar.com/Logo.png',
        vibrate: [100, 50, 100],
        sound: 'https://cdn.hushiar.com/moving.mp3',
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1,
          url: `https://panel.hushiar.com/deviceDetail;deviceId=${deviceId.toString()}/logList`,
        },
        actions: [{ action: 'view', title: 'مشاهده اخطار' }],
      },
    };

    await Promise.allSettled(
      user.wpSubList.map((sub) =>
        this.webPushProvider.sendNotification(sub, JSON.stringify(payload)),
      ),
    );
  }
}
