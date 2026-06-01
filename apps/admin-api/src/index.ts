import 'dotenv/config';
import { connect } from '@hushiar/db-schema';
import cors from 'cors';
import express from 'express';
import { createContainer } from './container.js';
import { actuatorRouter } from './routes/actuator.js';
import { archiveRouter } from './routes/archive.js';
import { deviceRouter } from './routes/device.js';
import { imageRouter } from './routes/image.js';
import { logRouter } from './routes/log.js';
import { sensorRouter } from './routes/sensor.js';
import { userRouter } from './routes/user.js';

const API_PORT = 4004;
const PACKAGE_NAME = 'api.admin.hs';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const container = createContainer();

app.get('/isAlive', (_req, res) => {
  res.json({ message: `${PACKAGE_NAME} is Alive!` });
});

app.use('/device', deviceRouter(container));
app.use('/sensor', sensorRouter(container));
app.use('/actuator', actuatorRouter(container));
app.use('/image', imageRouter(container));
app.use('/log', logRouter(container));
app.use('/archive', archiveRouter(container));
app.use('/user', userRouter(container));

connect()
  .then(() => {
    app.listen(API_PORT, () => {
      console.log(`Init ${PACKAGE_NAME} on ${API_PORT}`);
      console.log(`Access URL : http://localhost:${API_PORT}`);
    });
  })
  .catch((err: unknown) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
