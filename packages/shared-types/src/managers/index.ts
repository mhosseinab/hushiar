import type { Types } from 'mongoose';
import type { IActuator } from '../entities/actuator.js';
import type { IArchive } from '../entities/archive.js';
import type { ICommand } from '../entities/command.js';
import type { IDevice, IDevicePopulated } from '../entities/device.js';
import type { IImage } from '../entities/image.js';
import type { ILocation } from '../entities/location.js';
import type { ILog } from '../entities/log.js';
import type { ISensor } from '../entities/sensor.js';
import type { IStorage } from '../entities/storage.js';
import type { IUser, WebPushSubscription } from '../entities/user.js';

export interface IUserManager {
  get(userId: string): Promise<(IUser & { _id: Types.ObjectId }) | null>;
  create(title: string, mobileNumber: string): Promise<IUser & { _id: Types.ObjectId }>;
  addWebPushSub(userId: string, sub: WebPushSubscription): Promise<IUser & { _id: Types.ObjectId }>;
  setLastWPDateTime(userId: Types.ObjectId, date: Date): Promise<void>;
  setLastSMSDateTime(userId: Types.ObjectId, date: Date): Promise<void>;
  deductRemainingDays(): Promise<void>;
  setStorageUsage(userId: Types.ObjectId, usedSize: number): Promise<void>;
}

export interface IUserSmsUpdater {
  setLastSMSDateTime(userId: Types.ObjectId, date: Date): Promise<void>;
}

export interface IDeviceManager {
  getAll(): Promise<IDevicePopulated[]>;
  getAllByUser(userId: string): Promise<IDevicePopulated[]>;
  getByManufactureId(manufactureId: string): Promise<(IDevice & { _id: Types.ObjectId }) | null>;
  add(title: string, type: string, status: string): Promise<IDevice & { _id: Types.ObjectId }>;
  setup(userId: string, manufactureId: string): Promise<IDevice & { _id: Types.ObjectId }>;
  setOnAlarm(deviceId: Types.ObjectId, isOnAlarm: boolean): Promise<void>;
  setMovingStatus(deviceId: Types.ObjectId, isMoving: boolean): Promise<void>;
  registerDeviceToken(manufactureId: string): Promise<{ token: string; mqttBroker: string }>;
}

export interface ISensorManager {
  attachSensor(deviceId: Types.ObjectId, type: string): Promise<ISensor & { _id: Types.ObjectId }>;
  detachSensor(sensorId: Types.ObjectId): Promise<void>;
  getAllByDevice(deviceId: Types.ObjectId): Promise<(ISensor & { _id: Types.ObjectId })[]>;
}

export interface IActuatorManager {
  attachActuator(
    deviceId: Types.ObjectId,
    type: string,
  ): Promise<IActuator & { _id: Types.ObjectId }>;
  detachActuator(actuatorId: Types.ObjectId): Promise<void>;
  getAllByDevice(deviceId: Types.ObjectId): Promise<(IActuator & { _id: Types.ObjectId })[]>;
}

export interface IImageManager {
  add(
    deviceId: Types.ObjectId,
    actuatorId: Types.ObjectId,
    fileName: string,
    file: unknown,
  ): Promise<IImage & { _id: Types.ObjectId }>;
  getAllByDevice(deviceId: Types.ObjectId): Promise<(IImage & { _id: Types.ObjectId })[]>;
  getAllByDeviceAndTimeRange(
    deviceId: Types.ObjectId,
    start: Date,
    end: Date,
  ): Promise<(IImage & { _id: Types.ObjectId })[]>;
  removeByDevice(deviceId: Types.ObjectId): Promise<void>;
}

export interface IArchiveManager {
  add(
    deviceId: Types.ObjectId,
    sensorId: Types.ObjectId,
    start: Date,
    end: Date,
  ): Promise<IArchive & { _id: Types.ObjectId }>;
  complete(
    archiveId: Types.ObjectId,
    videoFileName: string,
    imageList: Types.ObjectId[],
  ): Promise<void>;
  getAllByDevice(deviceId: Types.ObjectId): Promise<(IArchive & { _id: Types.ObjectId })[]>;
}

export interface ILogManager {
  ingestLog(
    deviceId: Types.ObjectId,
    type: string,
    logData: unknown,
  ): Promise<ILog & { _id: Types.ObjectId }>;
  getAllByDevice(deviceId: Types.ObjectId): Promise<(ILog & { _id: Types.ObjectId })[]>;
}

export interface ICommandManager {
  add(
    deviceId: Types.ObjectId,
    actuatorId: Types.ObjectId,
    command: string,
  ): Promise<ICommand & { _id: Types.ObjectId }>;
  markDone(commandId: Types.ObjectId): Promise<void>;
  getPendingByDevice(deviceId: Types.ObjectId): Promise<(ICommand & { _id: Types.ObjectId })[]>;
}

export interface ILocationManager {
  add(
    userId: Types.ObjectId,
    title: string,
    address: string,
  ): Promise<ILocation & { _id: Types.ObjectId }>;
  getAllByUser(userId: Types.ObjectId): Promise<(ILocation & { _id: Types.ObjectId })[]>;
  remove(locationId: Types.ObjectId): Promise<void>;
}

export interface IStorageManager {
  getByUser(userId: Types.ObjectId): Promise<(IStorage & { _id: Types.ObjectId }) | null>;
  setStorageUsage(userId: Types.ObjectId, usedSize: number): Promise<void>;
  reconcileStorage(): Promise<void>;
}

export interface IAuthManager {
  generateToken(userId: string): Promise<string>;
  validateToken(token: string): Promise<(IUser & { _id: Types.ObjectId }) | null>;
}

export interface INotifyManager {
  sendMovingAlert(userId: Types.ObjectId, device: IDevicePopulated): Promise<void>;
}
