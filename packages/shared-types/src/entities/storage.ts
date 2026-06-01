import type { Types } from 'mongoose';

export interface IStorage {
  registerDate: Date;
  user: Types.ObjectId;
  usedSize: number;
  maxSize: number;
}
