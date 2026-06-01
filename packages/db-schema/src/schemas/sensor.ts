import type { ISensor } from '@hushiar/shared-types';
import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ISensorDoc extends ISensor, Document {}
export interface ISensorModel extends Model<ISensorDoc> {}

const SensorSchema = new Schema<ISensorDoc, ISensorModel>({
  registerDate: { type: Date, default: Date.now },
  manufactureId: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String },
  device: { type: Schema.Types.ObjectId, ref: 'Device' },
  isActive: { type: Boolean, default: false },
});

export const SensorModel = mongoose.model<ISensorDoc, ISensorModel>('Sensor', SensorSchema);
