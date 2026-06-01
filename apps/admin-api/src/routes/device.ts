import { type Request, type Response, Router } from 'express';
import type { Container } from '../container.js';

export function deviceRouter(container: Container): Router {
  const router = Router();
  const { deviceManager, sensorManager, actuatorManager } = container;

  router.post('/add', (req: Request, res: Response): void => {
    const title = req.body.title as string;
    const type = req.body.type as string;

    deviceManager
      .add(title, type, 'home')
      .then((createdDevice) =>
        sensorManager
          .addAndAttach('Detector', createdDevice._id)
          .then(() => {
            const actuatorTypeList = ['Buzzer', 'Beacon', 'Capture'];
            return Promise.all(
              actuatorTypeList.map((actuatorType) =>
                actuatorManager.addAndAttach(actuatorType, createdDevice._id),
              ),
            );
          })
          .then(() => {
            res.json({ device: createdDevice });
          }),
      )
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        res.status(400).json({ message });
      });
  });

  router.get('/configList', (_req: Request, res: Response): void => {
    deviceManager
      .getAll()
      .then((foundDeviceList) => {
        const deviceList = foundDeviceList.map((device) => ({
          manufactureId: device.manufactureId,
          mqttUserName: device.mqttUserName,
          mqttPassword: device.mqttPassword,
        }));
        res.json({ deviceList });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        res.status(400).json({ message });
      });
  });

  router.get('/getAll', (_req: Request, res: Response): void => {
    deviceManager
      .getAll()
      .then((foundDeviceList) => {
        res.json({ deviceList: foundDeviceList });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        res.status(400).json({ message });
      });
  });

  router.get('/configList_download', (_req: Request, res: Response): void => {
    deviceManager
      .getAll()
      .then((foundDeviceList) => {
        let content = '';
        for (const device of foundDeviceList) {
          content += `manufactureId: ${device.manufactureId} | mqttUserName: ${device.mqttUserName} | mqttPassword: ${device.mqttPassword}\n`;
        }
        res.attachment('config.txt');
        res.type('txt');
        res.send(content);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        res.status(400).json({ message });
      });
  });

  return router;
}
