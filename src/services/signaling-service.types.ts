/**
 * Serverless signaling boundary (PRD §1 "BLE handshake", adapted).
 *
 * Carries the WebRTC SDP offer/answer + ICE candidates between two peers over a
 * direct **LAN socket** (react-native-tcp-socket) — no signaling server. Peers
 * find each other's IP via the BLE-advertised token (discovery-service), then
 * one listens and the other connects. Messages are signed by encryption-service.
 */
export type SignalMessage =
  | { type: 'offer'; sdp: string; publicKey: string; sig: string }
  | { type: 'answer'; sdp: string; publicKey: string; sig: string }
  | { type: 'ice'; candidate: string };

export type SignalHandlers = {
  onMessage: (message: SignalMessage) => void;
  onError?: (error: Error) => void;
};

export interface SignalingService {
  /** Responder role: listen for an inbound handshake connection. */
  startServer(handlers: SignalHandlers): Promise<void>;
  /** Initiator role: connect to a discovered peer to begin the handshake. */
  connect(host: string, port: number, handlers: SignalHandlers): Promise<void>;
  /** Send a signaling message over the active connection. */
  send(message: SignalMessage): Promise<void>;
  /** Close any sockets/servers. */
  stop(): Promise<void>;
}
