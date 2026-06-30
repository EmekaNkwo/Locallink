import * as SecureStore from 'expo-secure-store';
import { Ed, hkdfSync } from 'react-native-quick-crypto';

import type { EncryptionService } from './encryption-service.types';

import { base64ToBytes, bytesToBase64, concatBytes } from '@/lib/bytes';

const SK_KEY = 'locallink.identity.privateKey';
const PK_KEY = 'locallink.identity.publicKey';
const SAS_SALT = 'locallink-sas-v1';

function toBytes(buffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer);
}

/**
 * Native identity crypto (PRD F1.3) — sub-phase 1c.
 *
 * WebRTC already encrypts the media + data path (DTLS-SRTP). This layer adds a
 * long-term Ed25519 identity so each device can SIGN its signaling transcript,
 * plus a Short Authentication String (the 6-digit PIN) derived from both public
 * keys so users can confirm out-of-band that there is no man-in-the-middle.
 *
 * The private key is persisted in the platform keystore via expo-secure-store.
 * Requires the global crypto polyfill (see src/lib/crypto-polyfill).
 */
class QuickCryptoEncryptionService implements EncryptionService {
  private privateKey: Uint8Array | null = null;
  private publicKey: Uint8Array | null = null;

  async init(): Promise<void> {
    if (this.privateKey && this.publicKey) return;

    const [storedSk, storedPk] = await Promise.all([
      SecureStore.getItemAsync(SK_KEY),
      SecureStore.getItemAsync(PK_KEY),
    ]);

    if (storedSk && storedPk) {
      this.privateKey = base64ToBytes(storedSk);
      this.publicKey = base64ToBytes(storedPk);
      return;
    }

    const ed = new Ed('ed25519', {});
    ed.generateKeyPairSync();
    this.privateKey = toBytes(ed.getPrivateKey());
    this.publicKey = toBytes(ed.getPublicKey());

    await Promise.all([
      SecureStore.setItemAsync(SK_KEY, bytesToBase64(this.privateKey)),
      SecureStore.setItemAsync(PK_KEY, bytesToBase64(this.publicKey)),
    ]);
  }

  async getPublicKey(): Promise<string> {
    await this.init();
    return bytesToBase64(this.publicKey as Uint8Array);
  }

  async sign(dataB64: string): Promise<string> {
    await this.init();
    const ed = new Ed('ed25519', {});
    const signature = ed.signSync(base64ToBytes(dataB64), this.privateKey as Uint8Array);
    return bytesToBase64(toBytes(signature));
  }

  async verify(peerPublicKeyB64: string, signatureB64: string, dataB64: string): Promise<boolean> {
    try {
      const ed = new Ed('ed25519', {});
      return ed.verifySync(
        base64ToBytes(signatureB64),
        base64ToBytes(dataB64),
        base64ToBytes(peerPublicKeyB64),
      );
    } catch {
      return false;
    }
  }

  async deriveSas(
    localPublicKeyB64: string,
    peerPublicKeyB64: string,
    transcript: string,
  ): Promise<string> {
    // Order keys deterministically so both peers derive the same SAS.
    const [first, second] =
      localPublicKeyB64 < peerPublicKeyB64
        ? [localPublicKeyB64, peerPublicKeyB64]
        : [peerPublicKeyB64, localPublicKeyB64];

    const ikm = concatBytes(base64ToBytes(first), base64ToBytes(second));
    const derived = hkdfSync('sha256', ikm, SAS_SALT, transcript, 4);
    const bytes = new Uint8Array(derived);
    const value =
      ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
    return (value % 1_000_000).toString().padStart(6, '0');
  }
}

export const encryptionService: EncryptionService = new QuickCryptoEncryptionService();
