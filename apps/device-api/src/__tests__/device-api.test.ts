import type {
  ActuatorManager,
  CommandManager,
  DeviceManager,
  ImageManager,
  LogManager,
  MqttManager,
  SensorManager,
} from '@hushiar/core';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';

// These tests guard the HTTP contract that physical device firmware depends on.
// Topic strings, endpoint paths, and response shapes are hardcoded in device firmware —
// any change here breaks hardware in the field without warning.

function makeMockManagers() {
  const deviceManager = {
    registerDeviceToken: vi.fn(),
    getByManufactureId: vi.fn(),
    getByToken: vi.fn(),
    setOnAlarm: vi.fn(),
    decryptMqttPassword: vi.fn(),
  } as unknown as DeviceManager;

  const sensorManager = {
    getAllByDevice: vi.fn().mockResolvedValue([]),
    attach: vi.fn(),
    detach: vi.fn(),
  } as unknown as SensorManager;

  const actuatorManager = {
    getAllByDevice: vi.fn().mockResolvedValue([]),
    getByDeviceAndType: vi.fn(),
    setStatus: vi.fn(),
    getList: vi.fn(),
  } as unknown as ActuatorManager;

  const imageManager = {
    storeImage: vi.fn(),
    create: vi.fn(),
    getList: vi.fn(),
    deleteByDeviceAndId: vi.fn(),
    setDeviceLastImage: vi.fn(),
    getDeviceLastImage: vi.fn(),
  } as unknown as ImageManager;

  const logManager = {
    ingestGetToken: vi.fn().mockResolvedValue(undefined),
    ingestMoving: vi.fn(),
    ingestImageCaptured: vi.fn(),
    getList: vi.fn(),
  } as unknown as LogManager;

  const mqttManager = {
    subscribeDeviceTopic: vi.fn().mockResolvedValue(undefined),
    setToken: vi.fn(),
    setStatus: vi.fn(),
    setResolution: vi.fn(),
    setRegisterDeviceCallback: vi.fn(),
    setUploadImageCallback: vi.fn(),
    setMovingCallback: vi.fn(),
    setActionCallback: vi.fn(),
  } as unknown as MqttManager;

  const commandManager = {
    getAllByDeviceAndStatus: vi.fn().mockResolvedValue([]),
    setExecutionResult: vi.fn().mockResolvedValue(undefined),
  } as unknown as CommandManager;

  return {
    deviceManager,
    sensorManager,
    actuatorManager,
    imageManager,
    logManager,
    mqttManager,
    commandManager,
  };
}

describe('GET /isAlive', () => {
  it('returns 200 with the canonical alive message', async () => {
    const managers = makeMockManagers();
    const app = createApp(managers);

    const res = await request(app).get('/isAlive');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'api.device.hs is Alive!' });
  });
});

describe('GET /register/:manufactureId — hardware token handshake', () => {
  it('returns token and mqttBroker when device exists', async () => {
    const managers = makeMockManagers();
    vi.mocked(managers.deviceManager.registerDeviceToken).mockResolvedValue({
      token: 'abc-token-xyz',
      mqttBroker: 'mqtt://mqtt.hushiar.com:1773',
    });
    vi.mocked(managers.deviceManager.getByManufactureId).mockResolvedValue({
      _id: 'device-id-1',
      user: 'user-id-1',
    } as never);
    const app = createApp(managers);

    const res = await request(app).get('/register/MFID001');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      token: 'abc-token-xyz',
      mqttBroker: expect.any(String),
    });
  });

  it('returns 403 when manufactureId is not in the database', async () => {
    const managers = makeMockManagers();
    vi.mocked(managers.deviceManager.registerDeviceToken).mockResolvedValue(null);
    const app = createApp(managers);

    const res = await request(app).get('/register/UNKNOWN_DEVICE');

    expect(res.status).toBe(403);
  });

  it('calls subscribeDeviceTopic with the issued token (device must receive commands after registration)', async () => {
    const managers = makeMockManagers();
    vi.mocked(managers.deviceManager.registerDeviceToken).mockResolvedValue({
      token: 'issued-token',
      mqttBroker: 'mqtt://broker',
    });
    vi.mocked(managers.deviceManager.getByManufactureId).mockResolvedValue({
      _id: 'device-id',
      user: 'user-id',
    } as never);
    const app = createApp(managers);

    await request(app).get('/register/MFID002');

    expect(vi.mocked(managers.mqttManager.subscribeDeviceTopic)).toHaveBeenCalledWith(
      'issued-token',
    );
  });
});

describe('Device auth middleware — all protected routes require a registered device', () => {
  it('returns 403 when devicemanufactureid header is absent', async () => {
    const managers = makeMockManagers();
    const app = createApp(managers);

    const res = await request(app).get('/sensor/attached?sensorManufactureId=S1');

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ message: 'Missing devicemanufactureid header' });
  });

  it('returns 403 when the header contains an unknown manufactureId', async () => {
    const managers = makeMockManagers();
    vi.mocked(managers.deviceManager.getByManufactureId).mockResolvedValue(null);
    const app = createApp(managers);

    const res = await request(app)
      .get('/sensor/attached?sensorManufactureId=S1')
      .set('devicemanufactureid', 'NOT_REGISTERED');

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ message: 'Device not found' });
  });

  it('passes through to the route handler when device is registered', async () => {
    const managers = makeMockManagers();
    vi.mocked(managers.deviceManager.getByManufactureId).mockResolvedValue({
      _id: 'device-id',
    } as never);
    vi.mocked(managers.sensorManager.attach).mockResolvedValue({ type: 'Detector' } as never);
    const app = createApp(managers);

    const res = await request(app)
      .get('/sensor/attached?sensorManufactureId=S1')
      .set('devicemanufactureid', 'MFID001');

    // Route ran (not blocked by auth), sensor mock returned a result
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ sensor: { type: 'Detector' } });
  });
});
