import 'dotenv/config';
import http from 'node:http';
import type { AuthenticatedSocket } from '@hushiar/core';
import { connect } from '@hushiar/db-schema';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { createContainer } from './container.js';
import { createAuthMiddleware } from './middleware/auth.js';
import { createActuatorRouter } from './routes/actuator.js';
import { createArchiveRouter } from './routes/archive.js';
import { createAuthRouter } from './routes/auth.js';
import { createDeviceTypeRouter } from './routes/device-type.js';
import { createDeviceRouter } from './routes/device.js';
import { createImageRouter } from './routes/image.js';
import { createLocationRouter } from './routes/location.js';
import { createLogRouter } from './routes/log.js';
import { createSensorRouter } from './routes/sensor.js';
import { createSubscriberRouter } from './routes/subscriber.js';
import { createUserRouter } from './routes/user.js';
import { startScheduler } from './scheduler.js';

const API_PORT = 4001;
const PACKAGE_NAME = 'api.app.hs';

async function main(): Promise<void> {
  // Wire container (providers + managers)
  const container = createContainer();

  // Connect to MongoDB
  await connect();
  console.log('MongoDB connected');

  // Express app
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, token, locationId, deviceid, actuatorid, archiveid, sensorid, currentimageid, imageid',
    );
    next();
  });

  // Socket.io
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    maxHttpBufferSize: 1e8,
    pingTimeout: 30000,
    cors: { origin: '*' },
  });

  // Auth middleware
  const checkAuth = createAuthMiddleware(container.authManager);

  // Socket.io auth middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.query.token as string | undefined;
    if (!token) return next(new Error('Access Denied'));
    try {
      const auth = await container.authManager.getById(new mongoose.Types.ObjectId(token));
      if (!auth?.user) return next(new Error('Access Denied'));
      (socket as AuthenticatedSocket).user = auth.user as AuthenticatedSocket['user'];
      next();
    } catch {
      next(new Error('Access Denied'));
    }
  });

  // Socket.io connection lifecycle
  io.on('connection', (socket) => {
    const authedSocket = socket as AuthenticatedSocket;
    console.log(`Socket Connected :: ${authedSocket.user._id.toString()}`);
    container.socketManager.onConnect(authedSocket);
    socket.on('disconnect', () => {
      container.socketManager.onDisconnect(authedSocket);
    });
  });

  // Health check
  app.get('/isAlive', (_req, res) => {
    res.json({ message: `${PACKAGE_NAME} is Alive!` });
  });

  // Socket list
  app.get('/socket/getAll', (_req, res) => {
    const socketList = container.socketManager.getAll();
    const result = socketList.map((s) => s.user);
    res.json({ socketList: result });
  });

  // Mount routers
  app.use(createAuthRouter(container.userManager, container.authManager, container.notifyManager));
  app.use(createLocationRouter(container.locationManager, checkAuth));
  app.use(
    createDeviceRouter(
      container.deviceManager,
      container.actuatorManager,
      container.sensorManager,
      container.mqttManager,
      container.logManager,
      container.commandManager,
      checkAuth,
    ),
  );
  app.use(createDeviceTypeRouter(container.deviceTypeManager, checkAuth));
  app.use(createSensorRouter(container.sensorManager, container.mqttManager, checkAuth));
  app.use(
    createActuatorRouter(
      container.actuatorManager,
      container.mqttManager,
      container.imageManager,
      checkAuth,
    ),
  );
  app.use(createImageRouter(container.imageManager, checkAuth));
  app.use(
    createArchiveRouter(
      container.archiveManager,
      container.deviceManager,
      container.videoManager,
      container.imageManager,
      checkAuth,
    ),
  );
  app.use(createLogRouter(container.logManager, container.deviceManager, checkAuth));
  app.use(createUserRouter(container.userManager, checkAuth));
  app.use(
    createSubscriberRouter(
      container.subscriberManager,
      container.deviceManager,
      container.logManager,
      checkAuth,
    ),
  );

  // Start scheduler
  const archiveDurationMin = Number(container.env.ARCHIVE_VIDEO_DURATION_MIN ?? 1);
  const cronJobs = startScheduler({
    deviceManager: container.deviceManager,
    imageManager: container.imageManager,
    archiveManager: container.archiveManager,
    videoManager: container.videoManager,
    logManager: container.logManager,
    userManager: container.userManager,
    storageManager: container.storageManager,
    socketManager: container.socketManager,
    archiveDurationMin,
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down...');
    io.close();
    for (const job of cronJobs) {
      job.stop();
    }
    await mongoose.disconnect();
    process.exit(0);
  });

  // Start HTTP server
  httpServer.listen(API_PORT, () => {
    console.log(`Init ${PACKAGE_NAME} on ${API_PORT}`);
    console.log(`Access URL : http://localhost:${API_PORT}`);
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
