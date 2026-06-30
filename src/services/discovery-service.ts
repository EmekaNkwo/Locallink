import * as Network from 'expo-network';
import {
  addAdvertisementListener,
  startAdvertising,
  startScanning,
  stopAdvertising,
  stopScanning,
  type AdvertisementEvent,
} from 'react-native-ble-lite';

import type { DiscoveryService, ScanHandlers } from './discovery-service.types';
import { peerSession } from './peer-session';

import { LOCALLINK_SERVICE_UUID, SIGNAL_PORT } from '@/constants/ble';
import { base64ToBytes, bytesToHex } from '@/lib/bytes';
import { encryptionService } from '@/services/encryption-service';

/** Map BLE RSSI (~-30 strong … -100 weak dBm) to a 0-100 signal percentage. */
function rssiToSignal(rssi: number): number {
  return Math.max(0, Math.min(100, Math.round(2 * (rssi + 100))));
}

/** Approximate distance (m) from RSSI using a simple log-distance model. */
function rssiToDistance(rssi: number): number {
  const distance = 10 ** ((-59 - rssi) / 20);
  return Math.max(0, Math.round(distance));
}

function ipToHex(ip: string): string {
  return ip
    .split('.')
    .map((octet) => (parseInt(octet, 10) & 0xff).toString(16).padStart(2, '0'))
    .join('');
}

function hexToIp(hex: string): string {
  return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6), hex.slice(6, 8)]
    .map((byte) => parseInt(byte, 16))
    .join('.');
}

function portToHex(port: number): string {
  return (port & 0xffff).toString(16).padStart(4, '0');
}

/**
 * Build the 10-byte advertised token: deviceId(4) + ipv4(4) + port(2), hex.
 * Peers parse this from the BLE service data to learn where to open the LAN
 * signaling socket (ble-lite is advertise/scan-only — no GATT connection).
 */
async function buildAdvertToken(): Promise<{ token: string; deviceId: string }> {
  await encryptionService.init();
  const publicKey = await encryptionService.getPublicKey();
  const deviceId = bytesToHex(base64ToBytes(publicKey).slice(0, 4));
  const ip = await Network.getIpAddressAsync().catch(() => '0.0.0.0');
  const token = `${deviceId}${ipToHex(ip)}${portToHex(SIGNAL_PORT)}`;
  return { token, deviceId };
}

type ParsedToken = { deviceId: string; host: string; port: number };

function parseAdvertToken(data: string): ParsedToken | null {
  if (!data || data.length < 20) return null;
  const deviceId = data.slice(0, 8);
  const host = hexToIp(data.slice(8, 16));
  const port = parseInt(data.slice(16, 20), 16);
  if (!port || host === '0.0.0.0') return null;
  return { deviceId, host, port };
}

/**
 * Native discovery via react-native-ble-lite (sub-phase 1b): advertise the
 * LocalLink service UUID + our LAN token so peers can find us, and scan for peers
 * doing the same. Pairing (1c) runs the identity + WebRTC handshake over LAN.
 */
class BleDiscoveryService implements DiscoveryService {
  scan({ onDevice, onError }: ScanHandlers): () => void {
    const fail = (error: unknown) =>
      onError?.(error instanceof Error ? error : new Error(String(error)));

    const subscription = addAdvertisementListener((event: AdvertisementEvent) => {
      const parsed = parseAdvertToken(event.data);
      if (!parsed) return;

      peerSession.registerPeer(parsed.deviceId, {
        host: parsed.host,
        port: parsed.port,
        name: `LocalLink ${parsed.deviceId.slice(0, 4)}`,
      });

      onDevice({
        id: parsed.deviceId,
        name: `LocalLink ${parsed.deviceId.slice(0, 4)}`,
        signal: rssiToSignal(event.rssi),
        distanceMeters: rssiToDistance(event.rssi),
        paired: false,
      });
    });

    // Listen for inbound handshakes, then begin advertising + scanning.
    // BLE calls reject when Bluetooth is off/unavailable (e.g. emulators) — route
    // those to onError instead of leaving an uncaught promise rejection.
    void peerSession.startResponder().catch(fail);
    void startScanning({ serviceUuid: LOCALLINK_SERVICE_UUID }).catch(fail);
    void buildAdvertToken()
      .then(({ token }) =>
        startAdvertising({ serviceUuid: LOCALLINK_SERVICE_UUID, data: token, connectable: false }),
      )
      .catch(fail);

    return () => {
      subscription.remove();
      void stopScanning().catch(() => {});
      void stopAdvertising().catch(() => {});
    };
  }

  async pair(deviceId: string, pin: string): Promise<boolean> {
    const sas = await peerSession.initiate(deviceId);
    return sas === pin;
  }
}

export const discoveryService: DiscoveryService = new BleDiscoveryService();
