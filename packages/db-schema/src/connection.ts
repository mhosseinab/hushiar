import mongoose from 'mongoose';

export async function connect(): Promise<void> {
  await mongoose.connect(process.env.MONGO_URI ?? 'mongodb://localhost:27017/hushiar');
}

export async function disconnect(): Promise<void> {
  await mongoose.disconnect();
}
