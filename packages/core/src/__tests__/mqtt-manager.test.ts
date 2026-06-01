import type { MqttProvider } from '@hushiar/providers';
import { describe, expect, it, vi } from 'vitest';
import { MqttManager } from '../managers/mqtt/index.js';

// These tests guard the server-side MQTT dispatch logic.
// The device hardware publishes on fixed topic patterns — if the parsing
// breaks, the server silently drops every image, motion event, or registration.

function createMockProvider() {
  const messageCallbackRef: { fn: ((topic: string, msg: Buffer) => void) | null } = { fn: null };
  const mock = {
    subscribeToTopicList: vi.fn().mockResolvedValue(undefined),
    subscribeToTopic: vi.fn().mockResolvedValue(undefined),
    unsubscribeFromTopic: vi.fn().mockResolvedValue(undefined),
    setMessageCallback: vi.fn((fn: (topic: string, msg: Buffer) => void) => {
      messageCallbackRef.fn = fn;
    }),
    publish: vi.fn(),
    disconnect: vi.fn().mockResolvedValue(undefined),
  };
  return { mock: mock as unknown as MqttProvider, trigger: messageCallbackRef };
}

describe('MqttManager — registration callback', () => {
  it('fires registerCallback when a device publishes to HSHYR_register', () => {
    const { mock, trigger } = createMockProvider();
    const manager = new MqttManager(mock);

    const registerCb = vi.fn();
    manager.setRegisterDeviceCallback(registerCb);

    trigger.fn?.('HSHYR_register', Buffer.from('device-manufacture-id'));
    expect(registerCb).toHaveBeenCalledWith(Buffer.from('device-manufacture-id'));
  });

  it('subscribes to the REGISTER topic on construction', () => {
    const { mock } = createMockProvider();
    new MqttManager(mock);
    expect(vi.mocked(mock.subscribeToTopicList)).toHaveBeenCalledWith(['HSHYR_register']);
  });
});

describe('MqttManager — image upload callback', () => {
  it('fires uploadImageCallback with extracted token when device sends an image', () => {
    const { mock, trigger } = createMockProvider();
    const manager = new MqttManager(mock);

    const uploadCb = vi.fn();
    manager.setUploadImageCallback(uploadCb);

    const imageData = Buffer.from('binary-image-data');
    trigger.fn?.('HSHYR_mydevtoken/pub/Image', imageData);

    expect(uploadCb).toHaveBeenCalledWith('mydevtoken', imageData);
  });

  it('does not fire uploadImageCallback for unrelated topics', () => {
    const { mock, trigger } = createMockProvider();
    const manager = new MqttManager(mock);

    const uploadCb = vi.fn();
    manager.setUploadImageCallback(uploadCb);

    trigger.fn?.('HSHYR_register', Buffer.from(''));
    expect(uploadCb).not.toHaveBeenCalled();
  });
});

describe('MqttManager — moving callback', () => {
  it('fires movingCallback with isMoving=true when payload is "1"', () => {
    const { mock, trigger } = createMockProvider();
    const manager = new MqttManager(mock);

    const movingCb = vi.fn();
    manager.setMovingCallback(movingCb);

    trigger.fn?.('HSHYR_mytoken/pub/Moving', Buffer.from('1'));
    expect(movingCb).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'moving', token: 'mytoken', type: 'Detector' }),
      true,
    );
  });

  it('fires movingCallback with isMoving=false when payload is "0"', () => {
    const { mock, trigger } = createMockProvider();
    const manager = new MqttManager(mock);

    const movingCb = vi.fn();
    manager.setMovingCallback(movingCb);

    trigger.fn?.('HSHYR_mytoken/pub/Moving', Buffer.from('0'));
    expect(movingCb).toHaveBeenCalledWith(expect.anything(), false);
  });
});

describe('MqttManager — sensor/actuator action callback', () => {
  it('fires actionCallback for Detector sensor topic', () => {
    const { mock, trigger } = createMockProvider();
    const manager = new MqttManager(mock);

    const actionCb = vi.fn();
    manager.setActionCallback(actionCb);

    trigger.fn?.('HSHYR_tok/pub/Detector', Buffer.from('1'));
    expect(actionCb).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'action', type: 'Detector', token: 'tok' }),
      true,
    );
  });

  it('fires actionCallback for Capture actuator topic', () => {
    const { mock, trigger } = createMockProvider();
    const manager = new MqttManager(mock);

    const actionCb = vi.fn();
    manager.setActionCallback(actionCb);

    trigger.fn?.('HSHYR_tok/pub/Capture', Buffer.from('0'));
    expect(actionCb).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'action', type: 'Capture' }),
      false,
    );
  });
});

describe('MqttManager — publish commands', () => {
  it('setToken publishes to the correct per-device topic', () => {
    const { mock } = createMockProvider();
    const manager = new MqttManager(mock);

    manager.setToken('MFID001', 'new-token-abc');
    expect(vi.mocked(mock.publish)).toHaveBeenCalledWith('HSHYR_MFID001/setToken', 'new-token-abc');
  });

  it('setStatus publishes "1" for true and "0" for false', () => {
    const { mock } = createMockProvider();
    const manager = new MqttManager(mock);

    manager.setStatus('token001', 'Detector', true);
    expect(vi.mocked(mock.publish)).toHaveBeenCalledWith('HSHYR_token001/sub/Detector', '1');

    manager.setStatus('token001', 'Buzzer', false);
    expect(vi.mocked(mock.publish)).toHaveBeenCalledWith('HSHYR_token001/sub/Buzzer', '0');
  });

  it('setResolution publishes the resolution value as a string', () => {
    const { mock } = createMockProvider();
    const manager = new MqttManager(mock);

    manager.setResolution('token001', 7);
    expect(vi.mocked(mock.publish)).toHaveBeenCalledWith('HSHYR_token001/sub/resolution', '7');
  });

  it('subscribeDeviceTopic subscribes to the wildcard pub topic', async () => {
    const { mock } = createMockProvider();
    const manager = new MqttManager(mock);

    await manager.subscribeDeviceTopic('device-token');
    expect(vi.mocked(mock.subscribeToTopic)).toHaveBeenCalledWith('HSHYR_device-token/pub/#');
  });
});
