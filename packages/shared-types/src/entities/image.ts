import type { Types } from 'mongoose';

export interface IImage {
  registerDate: Date;
  device: Types.ObjectId;
  actuator?: Types.ObjectId;
  file?: unknown;
  fileName: string;
}
