import type { ILog } from '@hushiar/shared-types';
import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ILogDoc extends ILog, Document {}
export interface ILogModel extends Model<ILogDoc> {}

const LogSchema = new Schema<ILogDoc, ILogModel>({
  registerDate: { type: Date, required: true },
  type: { type: String, required: true },
  logData: { type: Schema.Types.Mixed },
  device: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

export const LogModel = mongoose.model<ILogDoc, ILogModel>('Log', LogSchema);
