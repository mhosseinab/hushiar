import type { ISubscriber } from '@hushiar/shared-types';
import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ISubscriberDoc extends ISubscriber, Document {}
export interface ISubscriberModel extends Model<ISubscriberDoc> {}

const SubscriberSchema = new Schema<ISubscriberDoc, ISubscriberModel>({
  registerDate: { type: Date, required: true },
  title: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  device: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
  accessEndDate: { type: Date, required: true },
});

export const SubscriberModel = mongoose.model<ISubscriberDoc, ISubscriberModel>(
  'Subscriber',
  SubscriberSchema,
);
