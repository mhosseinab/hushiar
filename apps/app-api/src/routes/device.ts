import type {
  ActuatorManager,
  CommandManager,
  DeviceManager,
  LogManager,
  MqttManager,
  SensorManager,
} from '@hushiar/core';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import { Types } from 'mongoose';

export function createDeviceRouter(
  deviceManager: DeviceManager,
  actuatorManager: ActuatorManager,
  sensorManager: SensorManager,
  mqttManager: MqttManager,
  logManager: LogManager,
  commandManager: CommandManager,
  checkAuth: RequestHandler,
): Router {
  const router = Router();

  // GET /device/getAll_user
  router.get('/device/getAll_user', checkAuth, async (req, res) => {
    const user = req.user!;
    try {
      const deviceList = await deviceManager.getAllByUser(user._id.toString());
      // Strip user and registerDate from result (no mutation)
      const result = deviceList.map((d) => {
        const {
          user: _user,
          registerDate: _reg,
          ...rest
        } = d as typeof d & { user?: unknown; registerDate?: unknown };
        void _user;
        void _reg;
        return rest;
      });
      res.json({ deviceList: result });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // GET /device/get_user
  router.get('/device/get_user', checkAuth, async (req, res) => {
    const user = req.user!;
    const rawDeviceId = req.headers.deviceid;
    const deviceId = typeof rawDeviceId === 'string' ? rawDeviceId : undefined;
    if (!deviceId) {
      res.status(400).json({ message: 'deviceid header is required' });
      return;
    }
    try {
      const foundDevice = await deviceManager.getByUser(user._id.toString(), deviceId);
      if (!foundDevice) {
        res.status(400).json({ message: 'Device not found' });
        return;
      }
      const {
        user: _user,
        registerDate: _reg,
        ...device
      } = foundDevice as typeof foundDevice & { user?: unknown; registerDate?: unknown };
      void _user;
      void _reg;
      res.json({ device });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // POST /device/assignLocation
  router.post('/device/assignLocation', checkAuth, async (req, res) => {
    const { manufactureId, locationId } = req.body as {
      manufactureId?: string;
      locationId?: string;
    };
    try {
      const device = await deviceManager.assignLocation(
        new Types.ObjectId(locationId),
        manufactureId ?? '',
      );
      res.json({ device });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // POST /device/setAlarmStatus
  router.post('/device/setAlarmStatus', checkAuth, async (req, res) => {
    const { deviceId, isOnAlarm } = req.body as { deviceId?: string; isOnAlarm?: boolean };
    if (!deviceId) {
      res.status(400).json({ message: 'deviceId is required' });
      return;
    }
    try {
      const deviceObjId = new Types.ObjectId(deviceId);
      await deviceManager.setOnAlarm(deviceObjId, !!isOnAlarm);
      const device = await deviceManager.getByUser(req.user!._id.toString(), deviceId);
      const commandText = isOnAlarm ? 'ALARM_ON' : 'ALARM_OFF';
      if (device) {
        await commandManager.createForDevice(deviceObjId, commandText);
      }
      res.json({ device });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // POST /device/setIsMonitoring
  router.post('/device/setIsMonitoring', checkAuth, async (req, res) => {
    const { deviceId, isMonitoring } = req.body as { deviceId?: string; isMonitoring?: boolean };
    if (!deviceId) {
      res.status(400).json({ message: 'deviceId is required' });
      return;
    }
    try {
      const deviceObjId = new Types.ObjectId(deviceId);
      await deviceManager.setIsMonitoring(deviceObjId, !!isMonitoring);
      const device = await deviceManager.getByUser(req.user!._id.toString(), deviceId);
      res.json({ device });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // POST /device/setup
  router.post('/device/setup', checkAuth, async (req, res) => {
    const user = req.user!;
    const { manufactureId } = req.body as { manufactureId?: string };
    try {
      const updatedDevice = await deviceManager.setup(user._id.toString(), manufactureId ?? '');
      res.json({ device: updatedDevice });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // POST /device/setInfo
  router.post('/device/setInfo', checkAuth, async (req, res) => {
    const { deviceId, title, locationId } = req.body as {
      deviceId?: string;
      title?: string;
      locationId?: string;
    };
    if (!deviceId) {
      res.status(400).json({ message: 'deviceId is required' });
      return;
    }
    try {
      const updatedDevice = await deviceManager.setInfo(
        deviceId,
        title ?? '',
        new Types.ObjectId(locationId),
      );
      res.json({ device: updatedDevice });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // POST /device/setStatus
  router.post('/device/setStatus', checkAuth, async (req, res) => {
    const { deviceId, status } = req.body as { deviceId?: string; status?: string };
    if (!deviceId || !status) {
      res.status(400).json({ message: 'deviceId and status are required' });
      return;
    }
    try {
      const deviceObjId = new Types.ObjectId(deviceId);
      const updatedDevice = await deviceManager.setStatus(deviceObjId, status);
      if (!updatedDevice) {
        res.status(400).json({ message: 'Device not found' });
        return;
      }

      // Apply status-based rules (fire-and-forget side effects)
      const token = (updatedDevice as { token?: string }).token ?? '';
      if (status === 'home') {
        void actuatorManager.getByDeviceAndType(deviceObjId, 'Buzzer').then((a) => {
          if (a) {
            mqttManager.setStatus(token, 'Buzzer', false);
            void actuatorManager.setIsActive(deviceObjId, a._id, false);
          }
        });
        void actuatorManager.getByDeviceAndType(deviceObjId, 'Beacon').then((a) => {
          if (a) {
            mqttManager.setStatus(token, 'Beacon', false);
            void actuatorManager.setIsActive(deviceObjId, a._id, false);
          }
        });
        void sensorManager.getByDeviceAndType(deviceObjId, 'Detector').then((s) => {
          if (s) {
            mqttManager.setStatus(token, 'Detector', false);
            void sensorManager.setIsActive(deviceObjId, s._id, false);
          }
        });
        void logManager.ingestDeviceStatusChanged(deviceObjId, status);
      } else if (status === 'silentMonitoring') {
        void actuatorManager.getByDeviceAndType(deviceObjId, 'Buzzer').then((a) => {
          if (a) {
            mqttManager.setStatus(token, 'Buzzer', false);
            void actuatorManager.setIsActive(deviceObjId, a._id, false);
          }
        });
        void actuatorManager.getByDeviceAndType(deviceObjId, 'Beacon').then((a) => {
          if (a) {
            mqttManager.setStatus(token, 'Beacon', false);
            void actuatorManager.setIsActive(deviceObjId, a._id, false);
          }
        });
        void sensorManager.getByDeviceAndType(deviceObjId, 'Detector').then((s) => {
          if (s) {
            mqttManager.setStatus(token, 'Detector', true);
            void sensorManager.setIsActive(deviceObjId, s._id, true);
          }
        });
        void logManager.ingestDeviceStatusChanged(deviceObjId, status);
      } else if (status === 'secureMonitoring') {
        void actuatorManager.getByDeviceAndType(deviceObjId, 'Buzzer').then((a) => {
          if (a) {
            mqttManager.setStatus(token, 'Buzzer', true);
            void actuatorManager.setIsActive(deviceObjId, a._id, true);
          }
        });
        void actuatorManager.getByDeviceAndType(deviceObjId, 'Beacon').then((a) => {
          if (a) {
            mqttManager.setStatus(token, 'Beacon', true);
            void actuatorManager.setIsActive(deviceObjId, a._id, true);
          }
        });
        void sensorManager.getByDeviceAndType(deviceObjId, 'Detector').then((s) => {
          if (s) {
            mqttManager.setStatus(token, 'Detector', true);
            void sensorManager.setIsActive(deviceObjId, s._id, true);
          }
        });
        void logManager.ingestDeviceStatusChanged(deviceObjId, status);
      }

      res.json({ device: updatedDevice });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  return router;
}
