import type { SmsProvider } from '@hushiar/providers';
import type { IUser } from '@hushiar/shared-types';
import type { IUserSmsUpdater } from '@hushiar/shared-types';
import type { Types } from 'mongoose';

export class NotifyManager {
  constructor(
    private readonly smsProvider: SmsProvider,
    private readonly userSmsUpdater: IUserSmsUpdater,
  ) {}

  async sendVerificationCode(mobileNumber: string, code: string): Promise<void> {
    await this.smsProvider.sendTemplatedSms('hushiarVerification', mobileNumber, code);
  }

  async sendMovingAlert(user: IUser & { _id: Types.ObjectId }, deviceTitle: string): Promise<void> {
    const lastSMS = user.lastSMSDateTime;
    const secondsSinceLast = lastSMS
      ? (Date.now() - new Date(lastSMS).getTime()) / 1000
      : Number.POSITIVE_INFINITY;

    if (secondsSinceLast <= 60) return;

    await this.userSmsUpdater.setLastSMSDateTime(user._id, new Date());
    await this.smsProvider.sendTemplatedSms('hushiarMoving', user.mobileNumber, deviceTitle);
  }
}
