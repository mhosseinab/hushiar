import { Point } from '@hushiar/providers';
import type { InfluxProvider } from '@hushiar/providers';

export class InfluxManager {
  constructor(private readonly influxProvider: InfluxProvider) {}

  async writePoint(point: Point): Promise<void> {
    await this.influxProvider.writePoint(point);
  }
}

export { Point };
