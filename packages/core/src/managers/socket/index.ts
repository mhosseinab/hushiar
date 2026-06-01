import type { Types } from 'mongoose';
import type { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  user: { _id: Types.ObjectId };
}

export class SocketManager {
  private connections: AuthenticatedSocket[] = [];

  onConnect(socket: AuthenticatedSocket): void {
    const existing = this.connections.findIndex(
      (s) => s.user._id.toString() === socket.user._id.toString(),
    );
    if (existing !== -1) {
      this.connections.splice(existing, 1);
    }
    this.connections.push(socket);
  }

  onDisconnect(socket: AuthenticatedSocket): void {
    this.connections = this.connections.filter(
      (s) => s.user._id.toString() !== socket.user._id.toString(),
    );
  }

  getByUser(userId: Types.ObjectId): AuthenticatedSocket | undefined {
    return this.connections.find((s) => s.user._id.toString() === userId.toString());
  }

  getAll(): AuthenticatedSocket[] {
    return [...this.connections];
  }

  emit(userId: Types.ObjectId, event: string, data: unknown): void {
    const socket = this.getByUser(userId);
    socket?.emit(event, data);
  }
}
