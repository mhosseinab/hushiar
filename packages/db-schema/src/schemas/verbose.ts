import type { IVerbose } from '@hushiar/shared-types';
import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IVerboseDoc extends IVerbose, Document {}
export interface IVerboseModel extends Model<IVerboseDoc> {}

const VerboseSchema = new Schema<IVerboseDoc, IVerboseModel>({
  registerDate: { type: Date, required: true },
  data: { type: Schema.Types.Mixed },
  device: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
});

export const VerboseModel = mongoose.model<IVerboseDoc, IVerboseModel>('Verbose', VerboseSchema);
