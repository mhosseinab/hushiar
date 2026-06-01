import KavenegarApi from 'kavenegar';

export class SmsProvider {
  // biome-ignore lint/suspicious/noExplicitAny: kavenegar has no TypeScript types
  // biome-ignore lint/suspicious/noExplicitAny: field declaration mirrors constructor cast
  private client: any;

  constructor(apiKey: string) {
    // biome-ignore lint/suspicious/noExplicitAny: kavenegar has no TypeScript types
    this.client = (KavenegarApi as any).KavenegarApi({ apikey: apiKey });
  }

  async sendSms(sender: string, receptor: string, message: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.client.Send({ message, sender, receptor }, (_response: unknown, status: number) => {
        if (status !== 200) reject(new Error(`SMS failed with status ${status}`));
        else resolve();
      });
    });
  }

  async sendTemplatedSms(
    template: string,
    receptor: string,
    token: string,
    token2?: string,
    token3?: string,
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.client.VerifyLookup(
        { token, token2, token3, template, receptor },
        (_response: unknown, status: number) => {
          if (status !== 200) reject(new Error(`Templated SMS failed with status ${status}`));
          else resolve();
        },
      );
    });
  }
}
