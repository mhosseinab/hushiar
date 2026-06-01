import type { IUser } from '@hushiar/shared-types';
import type { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: IUser & { _id: Types.ObjectId };
    }
  }
}
