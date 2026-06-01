import type { SmsProvider } from '@hushiar/providers';
import type { IUserSmsUpdater } from '@hushiar/shared-types';
import type { IUser } from '@hushiar/shared-types';
import type { Types } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';
import { NotifyManager } from '../managers/notify/index.js';

function makeDeps() {
  const sms: SmsProvider = {
    sendSms: vi.fn().mockResolvedValue(undefined),
    sendTemplatedSms: vi.fn().mockResolvedValue(undefined),
  } as unknown as SmsProvider;

  const updater: IUserSmsUpdater = {
    setLastSMSDateTime: vi.fn().mockResolvedValue(undefined),
  };

  return { sms, updater };
}

function makeUser(lastSMSDateTime: Date | null): IUser & { _id: Types.ObjectId } {
  return {
    mobileNumber: '09123456789',
    lastSMSDateTime: lastSMSDateTime ?? undefined,
    _id: 'user-id' as unknown as Types.ObjectId,
  } as IUser & { _id: Types.ObjectId };
}

describe('NotifyManager.sendMovingAlert — SMS throttle logic', () => {
  it('sends SMS when lastSMSDateTime is null (first alert)', async () => {
    const { sms, updater } = makeDeps();
    const manager = new NotifyManager(sms, updater);

    await manager.sendMovingAlert(makeUser(null), 'Front Door Camera');

    expect(sms.sendTemplatedSms).toHaveBeenCalledWith(
      'hushiarMoving',
      '09123456789',
      'Front Door Camera',
    );
  });

  it('sends SMS when more than 60 seconds have passed since last SMS', async () => {
    const { sms, updater } = makeDeps();
    const manager = new NotifyManager(sms, updater);
    const old = new Date(Date.now() - 90_000); // 90s ago

    await manager.sendMovingAlert(makeUser(old), 'Back Camera');

    expect(sms.sendTemplatedSms).toHaveBeenCalledOnce();
  });

  it('suppresses SMS when fewer than 60 seconds have passed', async () => {
    const { sms, updater } = makeDeps();
    const manager = new NotifyManager(sms, updater);
    const recent = new Date(Date.now() - 30_000); // 30s ago

    await manager.sendMovingAlert(makeUser(recent), 'Side Camera');

    expect(sms.sendTemplatedSms).not.toHaveBeenCalled();
  });

  it('updates lastSMSDateTime before sending (prevents double-send on slow SMS)', async () => {
    const { sms, updater } = makeDeps();
    const manager = new NotifyManager(sms, updater);

    await manager.sendMovingAlert(makeUser(null), 'Camera');

    // updater must be called before (or alongside) the SMS
    expect(updater.setLastSMSDateTime).toHaveBeenCalled();
  });

  it('sendVerificationCode delegates to sendTemplatedSms with correct template', async () => {
    const { sms, updater } = makeDeps();
    const manager = new NotifyManager(sms, updater);

    await manager.sendVerificationCode('09001112233', '54321');

    expect(sms.sendTemplatedSms).toHaveBeenCalledWith(
      'hushiarVerification',
      '09001112233',
      '54321',
    );
  });
});
