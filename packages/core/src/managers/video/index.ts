import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { v4 as uuidv4 } from 'uuid';
// @ts-expect-error — videoshow has no type declarations
import videoshow from 'videoshow';

export class VideoManager {
  private readonly storagePath: string;

  constructor(storagePath?: string) {
    this.storagePath = storagePath ?? process.env.CAMERA_VIDEO_STORAGE_PATH ?? './storage/video';
  }

  getVideoPath(userId: string, deviceId: string, fileName: string): string {
    return `${this.storagePath}/${userId}/${deviceId}/${fileName}`;
  }

  async generateVideo(userId: string, deviceId: string, imagePaths: string[]): Promise<string> {
    const userDir = `${this.storagePath}/${userId}`;
    const deviceDir = `${userDir}/${deviceId}`;

    if (!existsSync(userDir)) {
      await mkdir(userDir, { recursive: true });
    } else if (!existsSync(deviceDir)) {
      await mkdir(deviceDir, { recursive: true });
    }

    const fileName = `${uuidv4()}.mp4`;
    const outputPath = this.getVideoPath(userId, deviceId, fileName);

    const videoOptions = {
      fps: 2,
      loop: 1,
      transition: false,
      videoBitrate: 256,
      videoCodec: 'libx264',
      size: '640x?',
      format: 'mp4',
      pixelFormat: 'yuv420p',
    };

    await new Promise<void>((resolve, reject) => {
      videoshow(imagePaths, videoOptions).save(outputPath).on('end', resolve).on('error', reject);
    });

    return fileName;
  }
}
