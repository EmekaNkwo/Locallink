import * as Network from 'expo-network';
import * as Device from 'expo-device';
import TcpSocket from 'react-native-tcp-socket';

import type { DiscoveryService, ScanHandlers } from './discovery-service.types';
import { peerSession } from './peer-session';

import { DISCOVERY_PORT, SIGNAL_PORT } from '@/constants/network';
import { base64ToBytes, bytesToHex } from '@/lib/bytes';
import { encryptionService } from '@/services/encryption-service';

type TcpServer = ReturnType<typeof TcpSocket.createServer>;
type TcpClient = ReturnType<typeof TcpSocket.createConnection>;

type DiscoveryPayload = {
  app: 'locallink';
  deviceId: string;
  name: string;
  host: string;
  signalingPort: number;
};

type ProbeResult = {
  payload: DiscoveryPayload;
  reachedHost: string;
};

const CONNECT_TIMEOUT_MS = 450;
const SCAN_BATCH_SIZE = 24;

function subnetPrefix(ip: string): string | null {
  const parts = ip.split('.');
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(Number(part)))) return null;
  return parts.slice(0, 3).join('.');
}

function candidateHosts(localIp: string): string[] {
  const prefix = subnetPrefix(localIp);
  if (!prefix) return [];
  return Array.from({ length: 254 }, (_, index) => `${prefix}.${index + 1}`).filter((host) => host !== localIp);
}

/**
 * Build this device's LAN discovery payload. The short deviceId is derived from
 * the persisted identity key so it remains stable across app restarts.
 */
async function buildDiscoveryPayload(): Promise<DiscoveryPayload> {
  await encryptionService.init();
  const publicKey = await encryptionService.getPublicKey();
  const deviceId = bytesToHex(base64ToBytes(publicKey).slice(0, 4));
  const host = await Network.getIpAddressAsync().catch(() => '0.0.0.0');
  return {
    app: 'locallink',
    deviceId,
    name: Device.deviceName ?? Device.modelName ?? `LocalLink ${deviceId.slice(0, 4)}`,
    host,
    signalingPort: SIGNAL_PORT,
  };
}

function isDiscoveryPayload(value: unknown): value is DiscoveryPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<DiscoveryPayload>;
  return (
    payload.app === 'locallink' &&
    typeof payload.deviceId === 'string' &&
    typeof payload.name === 'string' &&
    typeof payload.host === 'string' &&
    typeof payload.signalingPort === 'number'
  );
}

/**
 * Native Wi-Fi/LAN discovery: each phone exposes a tiny TCP responder on the
 * local network. Scanning walks the current /24 subnet, asks for LocalLink
 * metadata, and registers reachable peers for the existing signaling flow.
 */
class WifiDiscoveryService implements DiscoveryService {
  private discoveryServer: TcpServer | null = null;
  private localPayload: DiscoveryPayload | null = null;
  private readonly activeProbeSockets = new Set<TcpClient>();

  scan({ onDevice, onComplete, onError }: ScanHandlers): () => void {
    let stopped = false;
    const fail = (error: unknown) =>
      onError?.(error instanceof Error ? error : new Error(String(error)));

    void (async () => {
      try {
        await this.startDiscoveryResponder();
        await peerSession.startResponder();
        const localIp = this.localPayload?.host ?? (await Network.getIpAddressAsync());
        const hosts = candidateHosts(localIp);
        if (hosts.length === 0 || localIp === '0.0.0.0') {
          throw new Error('No local Wi-Fi/LAN IP address is available');
        }

        for (let index = 0; index < hosts.length && !stopped; index += SCAN_BATCH_SIZE) {
          const batch = hosts.slice(index, index + SCAN_BATCH_SIZE);
          const peers = await Promise.all(batch.map((host) => this.probeHost(host)));
          peers.filter((peer): peer is ProbeResult => peer !== null).forEach(({ payload: peer, reachedHost }) => {
            if (stopped || peer.deviceId === this.localPayload?.deviceId) return;
            peerSession.registerPeer(peer.deviceId, {
              host: reachedHost,
              port: peer.signalingPort,
              name: peer.name,
            });
            onDevice({
              id: peer.deviceId,
              name: peer.name,
              paired: false,
            });
          });
        }

        if (!stopped) onComplete?.();
      } catch (error) {
        if (!stopped) fail(error);
      }
    })();

    return () => {
      stopped = true;
      this.stopActiveProbes();
      void this.stopDiscoveryResponder();
      void peerSession.stopResponder();
    };
  }

  async pair(deviceId: string, pin: string): Promise<boolean> {
    const sas = await peerSession.initiate(deviceId);
    const verified = sas === pin;
    if (!verified) {
      await peerSession.close();
    }
    return verified;
  }

  private async startDiscoveryResponder(): Promise<void> {
    this.localPayload = await buildDiscoveryPayload();
    if (this.localPayload.host === '0.0.0.0') {
      throw new Error('No local Wi-Fi/LAN IP address is available');
    }
    if (this.discoveryServer) return;
    await new Promise<void>((resolve, reject) => {
      const server = TcpSocket.createServer((socket) => {
        const client = socket as TcpClient;
        client.setEncoding('utf8');
        client.write(`${JSON.stringify(this.localPayload)}\n`, 'utf8', () => client.destroy());
      });
      server.on('error', reject);
      server.listen({ port: DISCOVERY_PORT, host: '0.0.0.0' }, () => resolve());
      this.discoveryServer = server;
    });
  }

  private async stopDiscoveryResponder(): Promise<void> {
    this.discoveryServer?.close();
    this.discoveryServer = null;
  }

  private stopActiveProbes(): void {
    this.activeProbeSockets.forEach((socket) => socket.destroy());
    this.activeProbeSockets.clear();
  }

  private probeHost(host: string): Promise<ProbeResult | null> {
    return new Promise((resolve) => {
      let settled = false;
      let buffer = '';
      const settle = (payload: DiscoveryPayload | null, socket: TcpClient) => {
        if (settled) return;
        settled = true;
        this.activeProbeSockets.delete(socket);
        socket.destroy();
        resolve(payload ? { payload, reachedHost: host } : null);
      };

      const socket = TcpSocket.createConnection(
        { host, port: DISCOVERY_PORT, connectTimeout: CONNECT_TIMEOUT_MS },
        () => {
          socket.setEncoding('utf8');
        },
      );
      this.activeProbeSockets.add(socket);
      socket.setTimeout(CONNECT_TIMEOUT_MS, () => settle(null, socket));
      socket.on('data', (data) => {
        buffer += typeof data === 'string' ? data : data.toString('utf8');
        const newlineIndex = buffer.indexOf('\n');
        if (newlineIndex < 0) return;
        try {
          const parsed = JSON.parse(buffer.slice(0, newlineIndex));
          settle(isDiscoveryPayload(parsed) ? parsed : null, socket);
        } catch {
          settle(null, socket);
        }
      });
      socket.on('error', () => settle(null, socket));
      socket.on('close', () => settle(null, socket));
    });
  }
}

export const discoveryService: DiscoveryService = new WifiDiscoveryService();
