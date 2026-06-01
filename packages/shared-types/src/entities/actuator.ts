import type { Types } from 'mongoose';

export interface IActuator {
  registerDate: Date;
  manufactureId: string;
  type: string;
  status?: string;
  device?: Types.ObjectId;
  isActive?: boolean;
}
