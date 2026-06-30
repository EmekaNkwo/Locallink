import type { EncryptionService } from './encryption-service.types';

/** Web/preview mock: deterministic, non-secure stand-ins so UI flows work. */
class MockEncryptionService implements EncryptionService {
  async init(): Promise<void> {}

  async getPublicKey(): Promise<string> {
    return 'mock-public-key';
  }

  async sign(dataB64: string): Promise<string> {
    return `mock-sig:${dataB64.slice(0, 8)}`;
  }

  async verify(): Promise<boolean> {
    return true;
  }

  async deriveSas(): Promise<string> {
    return '000000';
  }
}

export const encryptionService: EncryptionService = new MockEncryptionService();
