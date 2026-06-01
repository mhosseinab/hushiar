import type { ILocation } from '@hushiar/shared-types';
import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ILocationDoc extends ILocation, Document {}
export interface ILocationModel extends Model<ILocation> {}

const LocationSchema = new Schema<ILocationDoc, ILocationModel>({
  registerDate: { type: Date, required: true },
  title: { type: String, required: true },
  address: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

export const LocationModel = mongoose.model<ILocationDoc, ILocationModel>(
  'Location',
  LocationSchema,
);
