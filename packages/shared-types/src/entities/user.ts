import type { Types } from 'mongoose';

export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface IUser {
  registerDate?: Date;
  title?: string;
  mobileNumber: string;
  email?: string;
  isValid?: boolean;
  credit?: number;
  wpSubList?: WebPushSubscription[];
  isMobileNumberConfirmed?: boolean;
  lastWPDateTime?: Date | null;
  lastSMSDateTime?: Date | null;
  storageMaxSize?: number;
  storageUsedSize?: number;
  storageRemainedSize?: number;
  remainingDays?: number;
}

export interface IUserPopulated extends IUser {
  _id: Types.ObjectId;
}
