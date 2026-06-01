import 'dotenv/config';
import { connect } from '@hushiar/db-schema';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';

const PORT = 4002;
const PACKAGE_NAME = 'api.subscriber.hs';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/isAlive', (_req, res) => {
  res.json({ message: `${PACKAGE_NAME} is Alive!` });
});

async function start(): Promise<void> {
  await connect();
  app.listen(PORT, () => {
    console.log(`Init ${PACKAGE_NAME} on ${PORT}`);
  });
}

process.on('SIGTERM', async () => {
  await mongoose.disconnect();
  process.exit(0);
});

void start();
