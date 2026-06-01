import type { IAuth } from '@hushiar/shared-types';
import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IAuthDoc extends IAuth, Document {}
export interface IAuthModel extends Model<IAuthDoc> {}

const AuthSchema = new Schema<IAuthDoc, IAuthModel>({
  authToken: { type: Number, required: true },
  createDate: { type: Date, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subscriber: { type: Schema.Types.ObjectId, ref: 'Subscriber' },
  enterDate: { type: Date },
});

export const AuthModel = mongoose.model<IAuthDoc, IAuthModel>('Auth', AuthSchema);
