import type { Types } from 'mongoose';

export interface ICommand {
  registerDate: Date;
  device: Types.ObjectId;
  actuator?: Types.ObjectId;
  sensor?: Types.ObjectId;
  command: string;
  logData?: unknown[];
  fetchDate?: Date;
  isDone?: boolean;
}
