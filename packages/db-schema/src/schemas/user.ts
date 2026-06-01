import type { IUser } from '@hushiar/shared-types';
import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IUserDoc extends IUser, Document {}
export interface IUserModel extends Model<IUserDoc> {}

const UserSchema = new Schema<IUserDoc, IUserModel>({
  registerDate: { type: Date, default: Date.now },
  title: { type: String },
  mobileNumber: { type: String, required: true },
  email: { type: String },
  isValid: { type: Boolean, default: false },
  credit: { type: Number, default: 0 },
  wpSubList: [{ type: Schema.Types.Mixed }],
  isMobileNumberConfirmed: { type: Boolean, default: false },
  lastWPDateTime: { type: Date, default: null },
  lastSMSDateTime: { type: Date, default: null },
  storageMaxSize: { type: Number, default: 0 },
  storageUsedSize: { type: Number, default: 0 },
  storageRemainedSize: { type: Number, default: 0 },
  remainingDays: { type: Number, default: 0 },
});

export const UserModel = mongoose.model<IUserDoc, IUserModel>('User', UserSchema);
