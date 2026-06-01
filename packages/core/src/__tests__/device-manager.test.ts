import type { IDeviceModel } from '@hushiar/db-schema';
import { describe, expect, it } from 'vitest';
import { DeviceManager } from '../managers/device/index.js';

function createMockModel(): IDeviceModel {
  return {
    findById: () => null,
    findOne: () => null,
    findOneAndUpdate: () => null,
    findByIdAndUpdate: () => null,
    find: () => [],
  } as unknown as IDeviceModel;
}

describe('DeviceManager — MQTT password encryption', () => {
  it('decryptMqttPassword round-trips a password correctly', () => {
    const manager = new DeviceManager(createMockModel());
    const _original = 'S3cur3P@ssw0rd!';
    const _encrypted = (manager as unknown as { decryptMqttPassword: (s: string) => string })
      .decryptMqttPassword;

    // Access through the public method: encrypt via add(), decrypt via decryptMqttPassword()
    // We test the decrypt side by encrypting inline and checking the result
    const _encrypted2 = (
      DeviceManager as unknown as { prototype: { decryptMqttPassword: (s: string) => string } }
    ).prototype;
    // Instead, test via the public API: create a manager and call decryptMqttPassword
    // on a value we encrypt with the same key
    const dm = new DeviceManager(createMockModel());
    // Encrypt using the module-private function via the DeviceManager (it exposes decrypt but not encrypt)
    // We can test the property: decrypt(encrypt(x)) === x by using two manager instances
    // The encrypt function is called inside add() — we test via a known round-trip
    // using decryptMqttPassword on a value we encrypt manually with the same algorithm
    const { createCipheriv, randomBytes } = require('node:crypto');
    const key = Buffer.from('test-key-32-chars-padded-0000000'.padEnd(32, '0').slice(0, 32));
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    const encBuf = Buffer.concat([cipher.update('mypassword', 'utf8'), cipher.final()]);
    const encStr = `${iv.toString('hex')}:${encBuf.toString('hex')}`;

    expect(dm.decryptMqttPassword(encStr)).toBe('mypassword');
  });

  it('decryptMqttPassword returns different plaintext for different ciphertexts', () => {
    const dm = new DeviceManager(createMockModel());
    const { createCipheriv, randomBytes } = require('node:crypto');
    const key = Buffer.from('test-key-32-chars-padded-0000000'.padEnd(32, '0').slice(0, 32));

    function enc(plain: string): string {
      const iv = randomBytes(16);
      const cipher = createCipheriv('aes-256-cbc', key, iv);
      const encBuf = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
      return `${iv.toString('hex')}:${encBuf.toString('hex')}`;
    }

    expect(dm.decryptMqttPassword(enc('password-A'))).toBe('password-A');
    expect(dm.decryptMqttPassword(enc('password-B'))).toBe('password-B');
    expect(dm.decryptMqttPassword(enc('password-A'))).not.toBe('password-B');
  });
});
