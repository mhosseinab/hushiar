import type { Types } from 'mongoose';

export interface ISubscriber {
  registerDate: Date;
  title: string;
  mobileNumber: string;
  device: Types.ObjectId;
  accessEndDate: Date;
}
