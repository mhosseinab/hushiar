import type { IArchive } from '@hushiar/shared-types';
import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IArchiveDoc extends IArchive, Document {}
export interface IArchiveModel extends Model<IArchiveDoc> {}

const ArchiveSchema = new Schema<IArchiveDoc, IArchiveModel>({
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  duration: { type: Number },
  device: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
  sensor: { type: Schema.Types.ObjectId, ref: 'Sensor' },
  isMoving: { type: Boolean, default: false },
  hasHighSound: { type: Boolean, default: false },
  hasHighTemperature: { type: Boolean, default: false },
  videoFileName: { type: String },
  imageList: [{ type: Schema.Types.ObjectId, ref: 'Image' }],
});

export const ArchiveModel = mongoose.model<IArchiveDoc, IArchiveModel>('Archive', ArchiveSchema);
