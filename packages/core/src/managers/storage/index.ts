import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { promisify } from 'node:util';
import type { IUserModel } from '@hushiar/db-schema';
import fastFolderSize from 'fast-folder-size';
import type { Types } from 'mongoose';

const getFolderSize = promisify(fastFolderSize);

export class StorageManager {
  private readonly imageStoragePath: string;
  private readonly videoStoragePath: string;

  constructor(
    private readonly userModel: IUserModel,
    imageStoragePath?: string,
    videoStoragePath?: string,
  ) {
    this.imageStoragePath =
      imageStoragePath ?? process.env.CAMERA_IMAGE_STORAGE_PATH ?? './storage/images';
    this.videoStoragePath =
      videoStoragePath ?? process.env.CAMERA_VIDEO_STORAGE_PATH ?? './storage/video';
  }

  async ensureUserFolders(userId: string): Promise<void> {
    const userImageDir = `${this.imageStoragePath}/${userId}`;
    const userVideoDir = `${this.videoStoragePath}/${userId}`;
    if (!existsSync(userImageDir)) await mkdir(userImageDir, { recursive: true });
    if (!existsSync(userVideoDir)) await mkdir(userVideoDir, { recursive: true });
  }

  async getUserStorageUsedSizeMB(userId: string): Promise<number> {
    const userImageDir = `${this.imageStoragePath}/${userId}`;
    const userVideoDir = `${this.videoStoragePath}/${userId}`;

    await this.ensureUserFolders(userId);

    const [imageBytes, videoBytes] = await Promise.all([
      getFolderSize(userImageDir).then((b) => b ?? 0),
      getFolderSize(userVideoDir).then((b) => b ?? 0),
    ]);

    return Math.floor((imageBytes + videoBytes) / 1024 / 1024);
  }

  async reconcileStorage(): Promise<void> {
    const users = await this.userModel.find({ isValid: true });
    await Promise.allSettled(
      users.map(async (user) => {
        try {
          const usedMB = await this.getUserStorageUsedSizeMB(user._id.toString());
          const maxMB = (user as { storageMaxSize?: number }).storageMaxSize ?? 0;
          const remainedMB = Math.max(0, maxMB - usedMB);
          await this.userModel.findByIdAndUpdate(user._id, {
            storageUsedSize: usedMB,
            storageRemainedSize: remainedMB,
          });
        } catch {
          // individual user reconciliation failure should not abort others
        }
      }),
    );
  }

  async updateStorageUsage(userId: Types.ObjectId, deltaMB: number): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $inc: { storageUsedSize: deltaMB, storageRemainedSize: -deltaMB },
    });
  }
}
