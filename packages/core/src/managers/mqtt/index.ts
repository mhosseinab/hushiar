import type { MqttProvider } from '@hushiar/providers';
import {
  ACTUATOR_TOPIC_LIST,
  MQTT_PREFIX,
  MQTT_TOPICS,
  SENSOR_TOPIC_LIST,
} from '@hushiar/shared-types';

export type TopicMethod = 'register' | 'uploadImage' | 'moving' | 'action' | 'resolution';

export interface TranslatedTopic {
  method: TopicMethod | undefined;
  token: string | undefined;
  type: string | undefined;
}

type RegisterCallback = (message: Buffer) => void;
type UploadImageCallback = (token: string, message: Buffer) => void;
type MovingCallback = (topic: TranslatedTopic, isMoving: boolean) => void;
type ActionCallback = (topic: TranslatedTopic, state: boolean) => void;

const PREFIX = MQTT_PREFIX;

export class MqttManager {
  private registerCallback: RegisterCallback | null = null;
  private uploadImageCallback: UploadImageCallback | null = null;
  private movingCallback: MovingCallback | null = null;
  private actionCallback: ActionCallback | null = null;

  constructor(private readonly mqttProvider: MqttProvider) {
    mqttProvider.subscribeToTopicList([MQTT_TOPICS.REGISTER]).catch(console.error);
    mqttProvider.setMessageCallback((topic, message) => this.handleSubscription(topic, message));
  }

  private extractToken(topicParam: string): string {
    return topicParam.substring(PREFIX.length + 1);
  }

  private translateTopic(topic: string): TranslatedTopic {
    const result: TranslatedTopic = { method: undefined, token: undefined, type: undefined };
    const parts = topic.split('/');

    if (!parts[0]) return result;

    if (parts[0].trim() === MQTT_TOPICS.REGISTER) {
      result.method = 'register';
      return result;
    }

    if (parts[1] === 'pub' && parts[2]) {
      const type = parts[2].trim();
      result.token = this.extractToken(parts[0]);

      if (type === MQTT_TOPICS.IMAGE) {
        result.method = 'uploadImage';
      } else if (type === MQTT_TOPICS.MOVING) {
        result.method = 'moving';
        result.type = 'Detector';
      } else if ((SENSOR_TOPIC_LIST as readonly string[]).includes(type)) {
        result.method = 'action';
        result.type = type;
      } else if ((ACTUATOR_TOPIC_LIST as readonly string[]).includes(type)) {
        result.method = 'action';
        result.type = type;
      } else if (type === MQTT_TOPICS.RESOLUTION) {
        result.method = 'resolution';
      }
    }

    return result;
  }

  private handleSubscription(topic: string, message: Buffer): void {
    const translated = this.translateTopic(topic);

    switch (translated.method) {
      case 'register':
        this.registerCallback?.(message);
        break;
      case 'uploadImage':
        if (translated.token) this.uploadImageCallback?.(translated.token, message);
        break;
      case 'moving':
        this.movingCallback?.(translated, message.toString() !== '0');
        break;
      case 'action':
        this.actionCallback?.(translated, message.toString() !== '0');
        break;
    }
  }

  setToken(deviceManufactureId: string, token: string): void {
    const topic = `${PREFIX}_${deviceManufactureId}/setToken`;
    this.mqttProvider.publish(topic, token);
  }

  setStatus(token: string, type: string, status: boolean): void {
    const topic = `${PREFIX}_${token}/sub/${type}`;
    this.mqttProvider.publish(topic, status ? '1' : '0');
  }

  setResolution(token: string, resolution: number): void {
    const topic = `${PREFIX}_${token}/sub/${MQTT_TOPICS.RESOLUTION}`;
    this.mqttProvider.publish(topic, resolution.toString());
  }

  async subscribeDeviceTopic(deviceToken: string): Promise<void> {
    await this.mqttProvider.subscribeToTopic(`${PREFIX}_${deviceToken}/pub/#`);
  }

  setRegisterDeviceCallback(fn: RegisterCallback): void {
    this.registerCallback = fn;
  }

  setUploadImageCallback(fn: UploadImageCallback): void {
    this.uploadImageCallback = fn;
  }

  setMovingCallback(fn: MovingCallback): void {
    this.movingCallback = fn;
  }

  setActionCallback(fn: ActionCallback): void {
    this.actionCallback = fn;
  }
}
