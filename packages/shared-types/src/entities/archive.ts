import type { Types } from 'mongoose';

export interface IArchive {
  startDate: Date;
  endDate?: Date;
  duration?: number;
  device: Types.ObjectId;
  sensor?: Types.ObjectId;
  isMoving?: boolean;
  hasHighSound?: boolean;
  hasHighTemperature?: boolean;
  videoFileName?: string;
  imageList?: Types.ObjectId[];
}
