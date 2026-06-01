import { InfluxDB, Point } from '@influxdata/influxdb-client';

interface InfluxConfig {
  url: string;
  token: string;
  org: string;
  bucket: string;
}

export class InfluxProvider {
  private client: InfluxDB;
  private org: string;
  private bucket: string;

  constructor(config: InfluxConfig) {
    this.client = new InfluxDB({ url: config.url, token: config.token });
    this.org = config.org;
    this.bucket = config.bucket;
  }

  async writePoint(point: Point): Promise<void> {
    const writeApi = this.client.getWriteApi(this.org, this.bucket);
    writeApi.writePoint(point);
    await writeApi.close();
  }

  async writeBoolean(
    measurement: string,
    deviceId: string,
    field: string,
    value: string,
  ): Promise<void> {
    const point = new Point(measurement).tag('deviceId', deviceId).stringField(field, value);
    await this.writePoint(point);
  }

  async writeString(
    measurement: string,
    deviceId: string,
    field: string,
    value: string,
  ): Promise<void> {
    const point = new Point(measurement).tag('deviceId', deviceId).stringField(field, value);
    await this.writePoint(point);
  }
}

export { Point };
