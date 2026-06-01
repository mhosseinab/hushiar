import type { Types } from 'mongoose';
import type { ILocation } from './location.js';
import type { IUser } from './user.js';

export interface IDevice {
  registerDate: Date;
  title: string;
  manufactureId: string;
  type: string;
  status: string;
  isOn: boolean;
  isMonitoring: boolean;
  isOnAlarm: boolean;
  isMoving: boolean;
  isLightOn: boolean;
  temperature?: number;
  user?: Types.ObjectId;
  location?: Types.ObjectId;
  token?: string;
  mqttUserName: string;
  mqttPassword: string;
}

export interface IDevicePopulated extends Omit<IDevice, 'user' | 'location'> {
  _id: Types.ObjectId;
  user: (IUser & { _id: Types.ObjectId }) | null;
  location: (ILocation & { _id: Types.ObjectId }) | null;
}
