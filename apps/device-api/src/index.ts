import 'dotenv/config';
import { connect } from '@hushiar/db-schema';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { createContainer } from './container.js';

const PORT = 4003;
const PACKAGE_NAME = 'api.device.hs';

const container = createContainer();
const app = createApp(container);

async function start(): Promise<void> {
  await connect();
  app.listen(PORT, () => {
    console.log(`Init ${PACKAGE_NAME} on ${PORT}`);
    console.log(`Access URL: http://localhost:${PORT}`);
  });
}

process.on('SIGTERM', async () => {
  await container.mqttProvider.disconnect().catch(console.error);
  await mongoose.disconnect();
  process.exit(0);
});

void start();
