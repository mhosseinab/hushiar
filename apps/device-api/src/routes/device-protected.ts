import type { CommandManager, DeviceManager } from '@hushiar/core';
import { Router } from 'express';
import type { Types } from 'mongoose';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export function createDeviceProtectedRouter(
  deviceManager: DeviceManager,
  commandManager: CommandManager,
): Router {
  const router = Router();

  // Set device on-alarm state — requires deviceAuth (req.device is populated)
  router.post('/device/onAlarm', async (req, res) => {
    const device = req.device!;
    const isOnAlarm = Boolean(req.body.isOnAlarm);
    try {
      await deviceManager.setOnAlarm(device._id, isOnAlarm);
      res.json({ device: { ...device, isOnAlarm } });
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  // Poll for pending commands — firmware calls this to receive queued actuator commands
  router.get('/device/getAllCommand', async (req, res) => {
    const device = req.device!;
    try {
      const commandList = await commandManager.getAllByDeviceAndStatus(device._id, false);
      res.json({ commandList });
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  // Confirm command execution — firmware calls this after carrying out a command
  router.post('/device/commandExecuteResult', async (req, res) => {
    const device = req.device!;
    const commandId: unknown = req.body.commandId;
    const isDone = Boolean(req.body.isDone);
    if (typeof commandId !== 'string' || !OBJECT_ID_RE.test(commandId)) {
      res.status(400).json({ message: 'commandId is required' });
      return;
    }
    try {
      await commandManager.setExecutionResult(
        device._id,
        commandId as unknown as Types.ObjectId,
        isDone,
      );
      res.json({ done: true });
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  return router;
}
