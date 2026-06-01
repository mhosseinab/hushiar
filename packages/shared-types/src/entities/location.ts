import type { Types } from 'mongoose';

export interface ILocation {
  registerDate: Date;
  title: string;
  address: string;
  user: Types.ObjectId;
}
