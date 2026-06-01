import type { Types } from 'mongoose';

export interface ISensor {
  registerDate: Date;
  manufactureId: string;
  type: string;
  status?: string;
  device?: Types.ObjectId;
  isActive?: boolean;
}
