import type { IDevice } from '@hushiar/shared-types';
import type { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      device?: IDevice & { _id: Types.ObjectId };
    }
  }
}
