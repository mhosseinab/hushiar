import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import type { IImage } from '@hushiar/shared-types';
import type { Types } from 'mongoose';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = join(__dirname, 'worker.js');
const MAX_MEMORY_IMAGES = 10;
const MINIMUM_AREA = 4000;

interface ImageRecord {
  deviceId: Types.ObjectId;
  imagePath: string;
  registeredAt: Date;
}

type MotionCallback = (device: IImage['device'], fromPath: string, toPath: string) => void;

export class MotionDetectorManager {
  private readonly storagePath: string;
  private readonly monitoringWindowMs: number;
  private imageRecords: ImageRecord[] = [];
  private motionCallback: MotionCallback | null = null;

  constructor(storagePath?: string, monitoringDurationSecond?: number) {
    this.storagePath = storagePath ?? process.env.CAMERA_IMAGE_STORAGE_PATH ?? './storage/images';
    const seconds = monitoringDurationSecond ?? Number(process.env.MONITORING_DURATION_SECOND ?? 5);
    this.monitoringWindowMs = seconds * 1000;
  }

  setOnMotionDetectedCallback(fn: MotionCallback): void {
    this.motionCallback = fn;
  }

  async addNewImage(
    image: IImage & {
      _id: Types.ObjectId;
      device: { _id: Types.ObjectId; user: { _id: Types.ObjectId } };
    },
  ): Promise<void> {
    const now = new Date();
    const imagePath = `${this.storagePath}/${image.device.user._id}/${image.device._id}/${(image as { fileName: string }).fileName}`;

    // Evict stale records outside monitoring window
    this.imageRecords = this.imageRecords.filter(
      (r) => now.getTime() - r.registeredAt.getTime() < this.monitoringWindowMs,
    );

    // Enforce FIFO cap to prevent unbounded Mat memory usage
    if (this.imageRecords.length >= MAX_MEMORY_IMAGES) {
      this.imageRecords.shift();
    }

    const deviceRecords = this.imageRecords.filter(
      (r) => r.deviceId.toString() === image.device._id.toString(),
    );

    this.imageRecords.push({
      deviceId: image.device._id,
      imagePath,
      registeredAt: image.registerDate,
    });

    // Compare the new image against all recent images for this device in parallel
    await Promise.allSettled(
      deviceRecords.map(async (record) => {
        const hasMotion = await this.compareImages(record.imagePath, imagePath);
        if (hasMotion) {
          this.motionCallback?.(image.device._id, record.imagePath, imagePath);
        }
      }),
    );
  }

  private compareImages(path1: string, path2: string): Promise<boolean> {
    return new Promise((resolve) => {
      const worker = new Worker(WORKER_PATH, {
        workerData: { imagePath1: path1, imagePath2: path2, minimumArea: MINIMUM_AREA },
      });
      worker.once('message', (result: boolean) => resolve(result));
      worker.once('error', () => resolve(false));
      worker.once('exit', () => {
        /* worker cleanup */
      });
    });
  }
}
