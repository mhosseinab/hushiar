import { describe, expect, it } from 'vitest';
import {
  ACTUATOR_TOPIC_LIST,
  MQTT_PREFIX,
  MQTT_TOPICS,
  SENSOR_TOPIC_LIST,
  buildPubTopic,
  buildSubTopic,
} from '../mqtt/index.js';

// These tests are the contract between the server and the physical hardware.
// Devices are flashed with hardcoded topic strings — changing any constant here
// means existing hardware in the field will stop working.

describe('MQTT_PREFIX', () => {
  it('matches hardcoded device prefix', () => {
    expect(MQTT_PREFIX).toBe('HSHYR');
  });
});

describe('MQTT_TOPICS', () => {
  it('REGISTER topic matches device expectation', () => {
    expect(MQTT_TOPICS.REGISTER).toBe('HSHYR_register');
  });

  it('IMAGE topic matches device expectation', () => {
    expect(MQTT_TOPICS.IMAGE).toBe('Image');
  });

  it('MOVING topic matches device expectation', () => {
    expect(MQTT_TOPICS.MOVING).toBe('Moving');
  });

  it('RESOLUTION topic matches device expectation', () => {
    expect(MQTT_TOPICS.RESOLUTION).toBe('resolution');
  });

  it('DETECTOR topic matches device expectation', () => {
    expect(MQTT_TOPICS.DETECTOR).toBe('Detector');
  });

  it('CAPTURE topic matches device expectation', () => {
    expect(MQTT_TOPICS.CAPTURE).toBe('Capture');
  });

  it('BUZZER topic matches device expectation', () => {
    expect(MQTT_TOPICS.BUZZER).toBe('Buzzer');
  });

  it('BEACON topic matches device expectation', () => {
    expect(MQTT_TOPICS.BEACON).toBe('Beacon');
  });
});

describe('buildPubTopic', () => {
  it('builds device publish topic in the format devices use', () => {
    expect(buildPubTopic('abc123', 'Image')).toBe('HSHYR_abc123/pub/Image');
  });

  it('builds moving topic correctly', () => {
    expect(buildPubTopic('tok001', 'Moving')).toBe('HSHYR_tok001/pub/Moving');
  });

  it('builds detector sensor topic correctly', () => {
    expect(buildPubTopic('tok001', 'Detector')).toBe('HSHYR_tok001/pub/Detector');
  });
});

describe('buildSubTopic', () => {
  it('builds server-to-device command topic correctly', () => {
    expect(buildSubTopic('abc123', 'Capture')).toBe('HSHYR_abc123/sub/Capture');
  });

  it('builds resolution command topic correctly', () => {
    expect(buildSubTopic('abc123', 'resolution')).toBe('HSHYR_abc123/sub/resolution');
  });
});

describe('SENSOR_TOPIC_LIST', () => {
  it('contains Detector', () => {
    expect(SENSOR_TOPIC_LIST).toContain('Detector');
  });
});

describe('ACTUATOR_TOPIC_LIST', () => {
  it('contains Capture', () => {
    expect(ACTUATOR_TOPIC_LIST).toContain('Capture');
  });

  it('contains Buzzer', () => {
    expect(ACTUATOR_TOPIC_LIST).toContain('Buzzer');
  });

  it('contains Beacon', () => {
    expect(ACTUATOR_TOPIC_LIST).toContain('Beacon');
  });
});
