import type { ICommand } from '@hushiar/shared-types';
import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ICommandDoc extends ICommand, Document {}
export interface ICommandModel extends Model<ICommandDoc> {}

const CommandSchema = new Schema<ICommandDoc, ICommandModel>({
  registerDate: { type: Date, default: Date.now },
  device: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
  actuator: { type: Schema.Types.ObjectId, ref: 'Actuator' },
  sensor: { type: Schema.Types.ObjectId, ref: 'Sensor' },
  command: { type: String, required: true },
  logData: [{ type: Schema.Types.Mixed }],
  fetchDate: { type: Date },
  isDone: { type: Boolean, default: false },
});

export const CommandModel = mongoose.model<ICommandDoc, ICommandModel>('Command', CommandSchema);
