import type { IStorage } from '@hushiar/shared-types';
import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IStorageDoc extends IStorage, Document {}
export interface IStorageModel extends Model<IStorageDoc> {}

const StorageSchema = new Schema<IStorageDoc, IStorageModel>({
  registerDate: { type: Date, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  usedSize: { type: Number, required: true },
  maxSize: { type: Number, required: true },
});

export const StorageModel = mongoose.model<IStorageDoc, IStorageModel>('Storage', StorageSchema);
