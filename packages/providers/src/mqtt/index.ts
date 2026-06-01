import mqtt, { type MqttClient } from 'mqtt';

interface MqttConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

export class MqttProvider {
  private client: MqttClient;
  private messageCallback: ((topic: string, message: Buffer) => void) | null = null;

  constructor(config: MqttConfig) {
    this.client = mqtt.connect(`mqtt://${config.host}:${config.port}`, {
      username: config.username,
      password: config.password,
    });

    this.client.on('connect', () => console.log('MQTT connected to Hushiar broker'));
    this.client.on('close', () => console.log('MQTT connection closed'));
    this.client.on('error', (err) => console.error('MQTT error:', err));
    this.client.on('message', (topic, message) => {
      this.messageCallback?.(topic, message);
    });
  }

  async subscribeToTopic(topic: string): Promise<void> {
    await this.client.subscribeAsync(topic);
  }

  async subscribeToTopicList(topics: string[]): Promise<void> {
    await Promise.all(topics.map((t) => this.subscribeToTopic(t)));
  }

  async unsubscribeFromTopic(topic: string): Promise<void> {
    await this.client.unsubscribeAsync(topic);
  }

  publish(topic: string, message: string): void {
    this.client.publish(topic, message);
  }

  setMessageCallback(fn: (topic: string, message: Buffer) => void): void {
    this.messageCallback = fn;
  }

  async disconnect(): Promise<void> {
    await this.client.endAsync();
  }
}
