/**
 * Identity / handshake crypto boundary (PRD F1.3).
 *
 * WebRTC already encrypts media + data (DTLS-SRTP), so this layer is about
 * IDENTITY: a long-term keypair to sign the session, plus a Short Authentication
 * String (the 6-digit PIN) the user verifies out-of-band to block MITM.
 *
 * Native: react-native-quick-crypto + expo-secure-store. Web: mock.
 */
export interface EncryptionService {
  /** Ensure an identity keypair exists (generate + persist on first run). */
  init(): Promise<void>;
  /** Base64 long-term public key. */
  getPublicKey(): Promise<string>;
  /** Sign bytes (base64 in/out) with the identity private key. */
  sign(dataB64: string): Promise<string>;
  /** Verify a signature against a peer public key. */
  verify(peerPublicKeyB64: string, signatureB64: string, dataB64: string): Promise<boolean>;
  /**
   * Derive a stable 6-digit Short Authentication String from both public keys
   * (+ DTLS fingerprints). Shown on both devices; a match confirms no MITM.
   */
  deriveSas(localPublicKeyB64: string, peerPublicKeyB64: string, transcript: string): Promise<string>;
}
