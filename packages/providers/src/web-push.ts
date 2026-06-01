import type { WebPushSubscription } from '@hushiar/shared-types';
import webpush from 'web-push';

interface VapidConfig {
  publicKey: string;
  privateKey: string;
  email: string;
}

export class WebPushProvider {
  constructor(config: VapidConfig) {
    webpush.setVapidDetails(`mailto:${config.email}`, config.publicKey, config.privateKey);
  }

  async sendNotification(subscription: WebPushSubscription, payload: string): Promise<void> {
    await webpush.sendNotification(
      subscription as Parameters<typeof webpush.sendNotification>[0],
      payload,
    );
  }
}
