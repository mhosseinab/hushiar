import type { WebPushSubscription } from '../entities/user.js';

// Auth
export interface LoginDto {
  mobileNumber: string;
}

export interface VerifyTokenDto {
  authToken: number;
  mobileNumber: string;
}

// Device
export interface SetupDeviceDto {
  userId: string;
  manufactureId: string;
}

export interface SetDeviceStatusDto {
  deviceId: string;
  status: string;
}

// Image
export interface GetImageListDto {
  deviceId: string;
  startDate?: string;
  endDate?: string;
}

// Command
export interface SendCommandDto {
  deviceId: string;
  actuatorId: string;
  command: string;
}

// Subscriber
export interface AddSubscriberDto {
  deviceId: string;
  title: string;
  mobileNumber: string;
  accessEndDate: string;
}

// WebPush
export interface WebPushSubscriptionDto {
  userId: string;
  subscription: WebPushSubscription;
}

// API responses
export interface ApiResponse<T> {
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Device registration (device-api)
export interface DeviceRegisterResponse {
  token: string;
  mqttBroker: string;
  mqttPort: number;
  mqttUsername: string;
  mqttPassword: string;
}

export interface DeviceStatusUpdate {
  deviceToken: string;
  status: string;
  value: string | number | boolean;
}
