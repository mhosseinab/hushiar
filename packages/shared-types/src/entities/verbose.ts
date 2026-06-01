import type { Types } from 'mongoose';

export interface IVerbose {
  registerDate: Date;
  data: unknown;
  device: Types.ObjectId;
}
