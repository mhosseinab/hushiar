import type { IImage } from '@hushiar/shared-types';
import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IImageDoc extends IImage, Document {}
export interface IImageModel extends Model<IImageDoc> {}

const ImageSchema = new Schema<IImageDoc, IImageModel>({
  registerDate: { type: Date, default: Date.now },
  device: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
  actuator: { type: Schema.Types.ObjectId, ref: 'Actuator' },
  file: { type: Schema.Types.Mixed },
  fileName: { type: String, required: true },
});

export const ImageModel = mongoose.model<IImageDoc, IImageModel>('Image', ImageSchema);
