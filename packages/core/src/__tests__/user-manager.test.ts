import type { IUserModel } from '@hushiar/db-schema';
import type { WebPushProvider } from '@hushiar/providers';
import { describe, expect, it, vi } from 'vitest';
import { UserManager } from '../managers/user/index.js';

function makeMockWebPush(): WebPushProvider {
  return {
    sendNotification: vi.fn().mockResolvedValue(undefined),
  } as unknown as WebPushProvider;
}

describe('UserManager.webPushNotify — throttle logic', () => {
  it('skips notification when lastWPDateTime is within 60 seconds', async () => {
    const recent = new Date(Date.now() - 30_000); // 30 seconds ago
    const mockUser = {
      wpSubList: [{ endpoint: 'https://example.com', keys: { p256dh: 'k', auth: 'a' } }],
      lastWPDateTime: recent,
    };
    const model = {
      findById: vi.fn().mockResolvedValue(mockUser),
      findByIdAndUpdate: vi.fn().mockResolvedValue({}),
      find: vi.fn(),
      findOne: vi.fn(),
    } as unknown as IUserModel;

    const webPush = makeMockWebPush();
    const manager = new UserManager(model, webPush);
    const userId = { toString: () => 'user-id' } as never;

    await manager.webPushNotify(userId, 'Camera 1', { toString: () => 'device-id' } as never);

    expect(webPush.sendNotification).not.toHaveBeenCalled();
  });

  it('sends notification when lastWPDateTime is null (first-time recipient)', async () => {
    const mockUser = {
      wpSubList: [{ endpoint: 'https://example.com', keys: { p256dh: 'k', auth: 'a' } }],
      lastWPDateTime: null,
    };
    const model = {
      findById: vi.fn().mockResolvedValue(mockUser),
      findByIdAndUpdate: vi.fn().mockResolvedValue({}),
      find: vi.fn(),
      findOne: vi.fn(),
    } as unknown as IUserModel;

    const webPush = makeMockWebPush();
    const manager = new UserManager(model, webPush);

    await manager.webPushNotify({ toString: () => 'u' } as never, 'Camera', {
      toString: () => 'd',
    } as never);

    expect(webPush.sendNotification).toHaveBeenCalledOnce();
  });

  it('sends notification when lastWPDateTime is older than 60 seconds', async () => {
    const old = new Date(Date.now() - 90_000); // 90 seconds ago
    const mockUser = {
      wpSubList: [{ endpoint: 'https://example.com', keys: { p256dh: 'k', auth: 'a' } }],
      lastWPDateTime: old,
    };
    const model = {
      findById: vi.fn().mockResolvedValue(mockUser),
      findByIdAndUpdate: vi.fn().mockResolvedValue({}),
      find: vi.fn(),
      findOne: vi.fn(),
    } as unknown as IUserModel;

    const webPush = makeMockWebPush();
    const manager = new UserManager(model, webPush);

    await manager.webPushNotify({ toString: () => 'u' } as never, 'Camera', {
      toString: () => 'd',
    } as never);

    expect(webPush.sendNotification).toHaveBeenCalledOnce();
  });

  it('skips when user has no wpSubList', async () => {
    const model = {
      findById: vi.fn().mockResolvedValue({ wpSubList: [] }),
      findByIdAndUpdate: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
    } as unknown as IUserModel;

    const webPush = makeMockWebPush();
    const manager = new UserManager(model, webPush);

    await manager.webPushNotify({ toString: () => 'u' } as never, 'Camera', {
      toString: () => 'd',
    } as never);

    expect(webPush.sendNotification).not.toHaveBeenCalled();
  });
});
