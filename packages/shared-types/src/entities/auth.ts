import type { Types } from 'mongoose';

export interface IAuth {
  authToken: number;
  createDate: Date;
  user: Types.ObjectId;
  subscriber?: Types.ObjectId;
  enterDate?: Date;
}
