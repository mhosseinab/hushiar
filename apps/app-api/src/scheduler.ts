import type {
  ArchiveManager,
  DeviceManager,
  ImageManager,
  LogManager,
  SocketManager,
  StorageManager,
  UserManager,
  VideoManager,
} from '@hushiar/core';
import { Cron } from 'croner';
import type { Types } from 'mongoose';

interface SchedulerDeps {
  deviceManager: DeviceManager;
  imageManager: ImageManager;
  archiveManager: ArchiveManager;
  videoManager: VideoManager;
  logManager: LogManager;
  userManager: UserManager;
  storageManager: StorageManager;
  socketManager: SocketManager;
  archiveDurationMin: number;
}

async function archiveImages(deps: SchedulerDeps): Promise<void> {
  console.log('archiving ...');
  const {
    deviceManager,
    imageManager,
    archiveManager,
    videoManager,
    logManager,
    socketManager,
    archiveDurationMin,
  } = deps;
  try {
    const foundDeviceList = await deviceManager.getAll();
    const toDateTime = new Date();
    const fromDateTime = new Date(toDateTime.getTime() - archiveDurationMin * 60 * 1000);

    for (const device of foundDeviceList) {
      await archiveDeviceImages(device, fromDateTime, toDateTime, {
        imageManager,
        archiveManager,
        videoManager,
        logManager,
        socketManager,
      });
    }
  } catch (err) {
    console.error(err);
  }
}

async function archiveDeviceImages(
  device: { _id: Types.ObjectId; title?: string; user?: { _id: Types.ObjectId } | null },
  fromDateTime: Date,
  toDateTime: Date,
  deps: {
    imageManager: ImageManager;
    archiveManager: ArchiveManager;
    videoManager: VideoManager;
    logManager: LogManager;
    socketManager: SocketManager;
  },
): Promise<void> {
  const { imageManager, archiveManager, videoManager, logManager, socketManager } = deps;
  try {
    const foundImageList = await imageManager.getAllByDeviceAndTimeRange(
      device._id,
      fromDateTime,
      toDateTime,
    );

    if (foundImageList.length === 0) {
      console.log(`No Image Found for ${device.title ?? 'unknown'}->${device._id.toString()}`);
      return;
    }

    const userId = device.user?._id.toString() ?? '';
    const deviceId = device._id.toString();
    console.log(`start archiving ${device.title ?? 'unknown'} -> ${deviceId}`);

    const archiveImageListPath = foundImageList.map((image) =>
      imageManager.getImagePath(userId, deviceId, (image as { fileName?: string }).fileName ?? ''),
    );

    const firstImage = foundImageList[0];
    const lastImage = foundImageList[foundImageList.length - 1];
    const firstImageDateTime = (firstImage as { registerDate?: Date }).registerDate ?? new Date();
    const lastImageDateTime = (lastImage as { registerDate?: Date }).registerDate ?? new Date();

    console.log(`firstImageDateTime: ${firstImageDateTime.toISOString()}`);
    console.log(`lastImageDateTime: ${lastImageDateTime.toISOString()}`);

    try {
      const videoFileName = await videoManager.generateVideo(
        userId,
        deviceId,
        archiveImageListPath,
      );
      const imageIds = foundImageList.map((img) => img._id);

      const archiveRecord = await archiveManager.completedWithService(
        device._id,
        firstImageDateTime,
        lastImageDateTime,
        videoFileName,
        imageIds,
      );

      const createdLog = await logManager.ingestVideoArchived(device._id, archiveRecord._id);
      console.log('Video File Archived');

      if (device.user?._id) {
        socketManager.emit(device.user._id, 'newLog', {
          deviceId: device._id,
          log: createdLog,
        });
      }
    } catch (err) {
      console.error(`Error generating video for device ${deviceId}:`, err);
    }
  } catch (err) {
    console.error(err);
  }
}

export function startScheduler(deps: SchedulerDeps): Cron[] {
  const { archiveDurationMin, userManager, storageManager } = deps;

  // Archive images every archiveDurationMin minutes
  const archiveJob = new Cron(`*/${archiveDurationMin} * * * *`, () => {
    void archiveImages(deps);
  });

  // Deduct remaining days at 10:50 daily
  const deductJob = new Cron('50 10 * * *', () => {
    void userManager.deductRemainingDays().catch(console.error);
  });

  // Storage reconciliation hourly
  const storageJob = new Cron('0 * * * *', () => {
    void storageManager.reconcileStorage().catch(console.error);
  });

  return [archiveJob, deductJob, storageJob];
}
