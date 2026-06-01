import type { LogManager } from '@hushiar/core';
import type express from 'express';
import { Router } from 'express';

export function createLogRouter(logManager: LogManager): Router {
  const router = Router();

  const ingestLogHandler: express.RequestHandler = async (req, res) => {
    const device = req.device;
    if (!device) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const logData: unknown = req.body.data;
    const logType =
      typeof logData === 'object' && logData !== null && 'type' in logData
        ? String((logData as Record<string, unknown>).type)
        : 'generic';

    try {
      const insertedLog = await logManager.ingestLog(device._id, logType, logData);
      res.json({ log: insertedLog });
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  router.post('/device/ingestLog', ingestLogHandler);
  // Firmware typo alias — kept for backward compatibility with hardware in the field
  router.post('/device/ingetLog', ingestLogHandler);

  return router;
}
