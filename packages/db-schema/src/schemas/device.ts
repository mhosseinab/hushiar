import type { IDevice } from '@hushiar/shared-types';
import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IDeviceDoc extends IDevice, Document {}
export interface IDeviceModel extends Model<IDeviceDoc> {}

const DeviceSchema = new Schema<IDeviceDoc, IDeviceModel>({
  registerDate: { type: Date, default: Date.now },
  title: { type: String, required: true },
  manufactureId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  status: { type: String, required: true },
  isOn: { type: Boolean, default: false },
  isMonitoring: { type: Boolean, default: false },
  isOnAlarm: { type: Boolean, default: false },
  isMoving: { type: Boolean, default: false },
  isLightOn: { type: Boolean, default: false },
  temperature: { type: Number },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  location: { type: Schema.Types.ObjectId, ref: 'Location' },
  token: { type: String },
  mqttUserName: { type: String, required: true },
  mqttPassword: { type: String, required: true },
});

export const DeviceModel = mongoose.model<IDeviceDoc, IDeviceModel>('Device', DeviceSchema);
