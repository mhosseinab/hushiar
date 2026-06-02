import { loadRootEnv } from '@hushiar/providers';
loadRootEnv();
import http from 'node:http';
import { AuthManager, SocketManager } from '@hushiar/core';
import type { AuthenticatedSocket } from '@hushiar/core';
import { AuthModel, connect } from '@hushiar/db-schema';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { Server } from 'socket.io';

const PORT = 4005;
const PACKAGE_NAME = 'api.live.hs';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e8,
  pingTimeout: 30000,
  cors: { origin: '*' },
});

const authManager = new AuthManager(AuthModel);
const socketManager = new SocketManager();

app.get('/isAlive', (_req, res) => {
  res.json({ message: `${PACKAGE_NAME} is Alive!` });
});

// Socket.io@4 auth middleware
io.use(async (socket, next) => {
  const token = socket.handshake.query.token as string | undefined;
  if (!token) return next(new Error('Access Denied'));
  try {
    const auth = await authManager.getById(new mongoose.Types.ObjectId(token));
    if (!auth?.user) return next(new Error('Access Denied'));
    (socket as AuthenticatedSocket).user = auth.user as AuthenticatedSocket['user'];
    next();
  } catch {
    next(new Error('Access Denied'));
  }
});

io.on('connection', (socket) => {
  const authedSocket = socket as AuthenticatedSocket;
  socketManager.onConnect(authedSocket);
  socket.on('disconnect', () => socketManager.onDisconnect(authedSocket));
});

async function start(): Promise<void> {
  await connect();
  server.listen(PORT, () => {
    console.log(`Init ${PACKAGE_NAME} on ${PORT}`);
  });
}

process.on('SIGTERM', async () => {
  io.close();
  await mongoose.disconnect();
  process.exit(0);
});

void start();
