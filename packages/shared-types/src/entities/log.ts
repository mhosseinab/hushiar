import type { Types } from 'mongoose';

export interface ILog {
  registerDate: Date;
  type: string;
  logData: unknown;
  device: Types.ObjectId;
  user: Types.ObjectId;
}
