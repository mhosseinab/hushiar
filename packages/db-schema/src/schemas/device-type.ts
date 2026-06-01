import type { IDeviceType } from '@hushiar/shared-types';
import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IDeviceTypeDoc extends IDeviceType, Document {}
export interface IDeviceTypeModel extends Model<IDeviceTypeDoc> {}

const DeviceTypeSchema = new Schema<IDeviceTypeDoc, IDeviceTypeModel>({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  payablePrice: { type: Number, required: true },
  description: { type: String, required: true },
  headImage: { type: String, required: true },
  imageList: [{ type: String }],
  isAvailable: { type: Boolean, required: true },
});

export const DeviceTypeModel = mongoose.model<IDeviceTypeDoc, IDeviceTypeModel>(
  'DeviceType',
  DeviceTypeSchema,
);
