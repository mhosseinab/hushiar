import type { IActuator } from '@hushiar/shared-types';
import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IActuatorDoc extends IActuator, Document {}
export interface IActuatorModel extends Model<IActuatorDoc> {}

const ActuatorSchema = new Schema<IActuatorDoc, IActuatorModel>({
  registerDate: { type: Date, default: Date.now },
  manufactureId: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String },
  device: { type: Schema.Types.ObjectId, ref: 'Device' },
  isActive: { type: Boolean, default: false },
});

export const ActuatorModel = mongoose.model<IActuatorDoc, IActuatorModel>(
  'Actuator',
  ActuatorSchema,
);
