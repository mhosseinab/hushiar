export const MQTT_PREFIX = 'HSHYR';

export const MQTT_TOPICS = {
  REGISTER: 'HSHYR_register',
  IMAGE: 'Image',
  MOVING: 'Moving',
  DETECTOR: 'Detector',
  CAPTURE: 'Capture',
  BUZZER: 'Buzzer',
  BEACON: 'Beacon',
  RESOLUTION: 'resolution',
} as const;

export type MqttTopicValue = (typeof MQTT_TOPICS)[keyof typeof MQTT_TOPICS];

export const SENSOR_TOPIC_LIST = ['Detector'] as const;
export const ACTUATOR_TOPIC_LIST = ['Capture', 'Buzzer', 'Beacon'] as const;

export type SensorTopic = (typeof SENSOR_TOPIC_LIST)[number];
export type ActuatorTopic = (typeof ACTUATOR_TOPIC_LIST)[number];

export interface TopicTranslation {
  deviceToken: string;
  topic: MqttTopicValue;
  direction: 'pub' | 'sub';
}

export function buildPubTopic(deviceToken: string, type: string): string {
  return `${MQTT_PREFIX}_${deviceToken}/pub/${type}`;
}

export function buildSubTopic(deviceToken: string, type: string): string {
  return `${MQTT_PREFIX}_${deviceToken}/sub/${type}`;
}
