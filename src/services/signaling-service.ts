import TcpSocket from 'react-native-tcp-socket';

import type { SignalHandlers, SignalingService, SignalMessage } from './signaling-service.types';

import { SIGNAL_PORT } from '@/constants/ble';

type TcpServer = ReturnType<typeof TcpSocket.createServer>;
type TcpClient = ReturnType<typeof TcpSocket.createConnection>;

/**
 * Native LAN signaling (PRD §1) — sub-phase 1c.
 *
 * ble-lite is advertise/scan-only (no GATT), so the WebRTC SDP/ICE handshake
 * travels over a direct TCP socket on the local network. The responder listens
 * on SIGNAL_PORT; the initiator (who learned the peer IP from the BLE token)
 * connects to it. Messages are newline-delimited JSON.
 */
class LanSignalingService implements SignalingService {
  private server: TcpServer | null = null;
  private socket: TcpClient | null = null;
  private buffer = '';

  async startServer(handlers: SignalHandlers): Promise<void> {
    await this.stop();
    await new Promise<void>((resolve, reject) => {
      const server = TcpSocket.createServer((socket) => {
        this.socket = socket as TcpClient;
        socket.setEncoding('utf8');
        this.attach(socket as TcpClient, handlers);
      });
      server.on('error', (error) => {
        handlers.onError?.(error);
        reject(error);
      });
      server.listen({ port: SIGNAL_PORT, host: '0.0.0.0' }, () => resolve());
      this.server = server;
    });
  }

  async connect(host: string, port: number, handlers: SignalHandlers): Promise<void> {
    await this.stop();
    await new Promise<void>((resolve, reject) => {
      const socket = TcpSocket.createConnection({ host, port }, () => resolve());
      socket.setEncoding('utf8');
      socket.on('error', (error) => {
        handlers.onError?.(error);
        reject(error);
      });
      this.socket = socket;
      this.attach(socket, handlers);
    });
  }

  async send(message: SignalMessage): Promise<void> {
    const socket = this.socket;
    if (!socket) throw new Error('No active signaling connection');
    socket.write(`${JSON.stringify(message)}\n`, 'utf8');
  }

  async stop(): Promise<void> {
    this.socket?.destroy();
    this.socket = null;
    this.server?.close();
    this.server = null;
    this.buffer = '';
  }

  private attach(socket: TcpClient, handlers: SignalHandlers): void {
    socket.on('data', (data) => {
      this.buffer += typeof data === 'string' ? data : data.toString('utf8');
      let newlineIndex = this.buffer.indexOf('\n');
      while (newlineIndex >= 0) {
        const line = this.buffer.slice(0, newlineIndex).trim();
        this.buffer = this.buffer.slice(newlineIndex + 1);
        if (line) {
          try {
            handlers.onMessage(JSON.parse(line) as SignalMessage);
          } catch (error) {
            handlers.onError?.(error as Error);
          }
        }
        newlineIndex = this.buffer.indexOf('\n');
      }
    });
  }
}

export const signalingService: SignalingService = new LanSignalingService();
