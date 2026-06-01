import { parentPort, workerData } from 'node:worker_threads';

interface WorkerInput {
  imagePath1: string;
  imagePath2: string;
  minimumArea: number;
}

async function run(): Promise<void> {
  const { imagePath1, imagePath2, minimumArea } = workerData as WorkerInput;

  let cv: typeof import('opencv4nodejs') | undefined;
  try {
    // opencv4nodejs is an optional dependency — skip gracefully if not installed
    cv = (await import('opencv4nodejs')).default;
  } catch {
    parentPort?.postMessage(false);
    return;
  }

  try {
    const mat1 = cv.imread(imagePath1);
    const mat2 = cv.imread(imagePath2);

    const gray1 = mat1.cvtColor(cv.COLOR_BGR2GRAY);
    const gray2 = mat2.cvtColor(cv.COLOR_BGR2GRAY);

    const diff = gray1.absdiff(gray2);
    let thresh = diff.threshold(25, 255, cv.THRESH_BINARY);
    thresh = thresh.dilate(
      cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(4, 4)),
      new cv.Point2(-1, -1),
      2,
    );
    const contours = thresh.copy().findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    const hasMotion = contours.some((c: { area: number }) => c.area > minimumArea);
    parentPort?.postMessage(hasMotion);
  } catch {
    parentPort?.postMessage(false);
  }
}

void run();
