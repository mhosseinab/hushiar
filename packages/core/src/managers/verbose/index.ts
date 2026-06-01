import type { IVerboseModel } from '@hushiar/db-schema';
import type { IVerbose } from '@hushiar/shared-types';
import type { Types } from 'mongoose';

export class VerboseManager {
  constructor(private readonly verboseModel: IVerboseModel) {}

  async ingest(
    deviceId: Types.ObjectId,
    data: unknown,
  ): Promise<IVerbose & { _id: Types.ObjectId }> {
    const doc = new this.verboseModel({
      registerDate: new Date(),
      device: deviceId,
      data,
    });
    return doc.save() as unknown as IVerbose & { _id: Types.ObjectId };
  }
}
