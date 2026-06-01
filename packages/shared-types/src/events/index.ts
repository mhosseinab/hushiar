import type { Types } from 'mongoose';

export interface MotionEvent {
  deviceId: Types.ObjectId;
  deviceToken: string;
  timestamp: Date;
  isMoving: boolean;
}

export interface ImageCaptureEvent {
  deviceId: Types.ObjectId;
  deviceToken: string;
  fileName: string;
  timestamp: Date;
}

export interface DeviceRegisteredEvent {
  deviceId: Types.ObjectId;
  manufactureId: string;
  token: string;
  timestamp: Date;
}
