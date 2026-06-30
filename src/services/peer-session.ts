import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import {
  mediaDevices,
  RTCIceCandidate,
  RTCPeerConnection,
} from 'react-native-webrtc';
import type MediaStream from 'react-native-webrtc/lib/typescript/MediaStream';

import { encryptionService } from './encryption-service';
import { signalingService } from './signaling-service';
import type { SignalHandlers, SignalMessage } from './signaling-service.types';

import { utf8ToBase64 } from '@/lib/bytes';
import type { CallSession, Message } from '@/types';

type DataChannel = ReturnType<RTCPeerConnection['createDataChannel']>;
type Role = 'initiator' | 'responder';

/**
 * react-native-webrtc objects extend an event-target-shim EventTarget whose
 * `addEventListener` isn't surfaced in the published types. This helper adds it
 * back with precise per-event typing (no `any`).
 */
type Listenable<E> = { addEventListener: (type: string, listener: (event: E) => void) => void };
function listen<E>(target: object, type: string, listener: (event: E) => void): void {
  (target as Listenable<E>).addEventListener(type, listener);
}

export type PeerAddress = { host: string; port: number; name: string };

/** Control + data envelope sent over the WebRTC data channel. */
type ChatEnvelope =
  | { t: 'msg'; message: Message }
  | { t: 'meta'; name: string; battery: number };

/** Minimal shape of the WebRTC stats reports we care about. */
type StatsReport = {
  type?: string;
  state?: string;
  nominated?: boolean;
  selected?: boolean;
  currentRoundTripTime?: number;
};

/**
 * Single source of truth for the live peer connection (sub-phases 1c–1e).
 *
 * Owns the RTCPeerConnection, the LAN signaling transport, the audio stream,
 * and the "chat" data channel. discovery/call/message services are thin
 * adapters over this object so the WebRTC peer + data channel are shared.
 *
 * Native only — never imported by the web (.web.ts) service variants.
 */
class PeerSession {
  private readonly peers = new Map<string, PeerAddress>();

  private pc: RTCPeerConnection | null = null;
  private chat: DataChannel | null = null;
  private localStream: MediaStream | null = null;

  private peerDeviceId: string | null = null;
  private peerName = 'Peer';
  private peerBattery = 0;
  private localPublicKey: string | null = null;
  private peerPublicKey: string | null = null;
  private offerSdp = '';
  private sas: string | null = null;

  private connectedResolve: (() => void) | null = null;
  private connectedReject: ((error: Error) => void) | null = null;
  private latencyTimer: ReturnType<typeof setInterval> | null = null;
  private responderReady = false;

  private readonly latencyListeners = new Set<(latencyMs: number) => void>();
  private readonly messageListeners = new Set<(message: Message) => void>();

  registerPeer(deviceId: string, address: PeerAddress): void {
    this.peers.set(deviceId, address);
  }

  onLatency(cb: (latencyMs: number) => void): () => void {
    this.latencyListeners.add(cb);
    return () => this.latencyListeners.delete(cb);
  }

  onMessage(cb: (message: Message) => void): () => void {
    this.messageListeners.add(cb);
    return () => this.messageListeners.delete(cb);
  }

  /** Responder role: listen so discovered peers can open a handshake to us. */
  async startResponder(): Promise<void> {
    if (this.responderReady) return;
    await encryptionService.init();
    this.localPublicKey = await encryptionService.getPublicKey();
    await signalingService.startServer(this.signalHandlers('responder'));
    this.responderReady = true;
  }

  /**
   * Initiator role: connect to a discovered peer, run the WebRTC handshake, and
   * resolve with the derived SAS once media is connected.
   */
  async initiate(deviceId: string): Promise<string> {
    const address = this.peers.get(deviceId);
    if (!address) throw new Error('Unknown peer — run a scan first');

    await encryptionService.init();
    this.localPublicKey = await encryptionService.getPublicKey();
    this.peerDeviceId = deviceId;
    this.peerName = address.name;

    const connected = this.armConnected();
    await signalingService.connect(address.host, address.port, this.signalHandlers('initiator'));

    const pc = this.createPeerConnection();
    await this.attachLocalAudio(pc);
    this.setupChannel(pc.createDataChannel('chat', { ordered: true }));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.offerSdp = pc.localDescription?.sdp ?? offer.sdp;
    const sig = await encryptionService.sign(utf8ToBase64(this.offerSdp));
    await signalingService.send({
      type: 'offer',
      sdp: this.offerSdp,
      publicKey: this.localPublicKey,
      sig,
    });

    await connected;
    return this.sas ?? '------';
  }

  /** Ensure a connected session exists (re-initiating the paired peer if dropped). */
  async getOrCreateSession(): Promise<CallSession> {
    if (!this.pc || this.pc.connectionState !== 'connected') {
      if (!this.peerDeviceId) throw new Error('No paired peer');
      await this.initiate(this.peerDeviceId);
    }
    return this.buildSession();
  }

  async sendMessage(message: Message): Promise<void> {
    const channel = this.chat;
    if (!channel || channel.readyState !== 'open') {
      throw new Error('Data channel not open');
    }
    const envelope: ChatEnvelope = { t: 'msg', message };
    channel.send(JSON.stringify(envelope));
  }

  setMicEnabled(enabled: boolean): void {
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  getSas(): string | null {
    return this.sas;
  }

  async close(): Promise<void> {
    if (this.latencyTimer) {
      clearInterval(this.latencyTimer);
      this.latencyTimer = null;
    }
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = null;
    this.chat?.close();
    this.chat = null;
    this.pc?.close();
    this.pc = null;
    this.peerPublicKey = null;
    this.sas = null;
    this.responderReady = false;
    await signalingService.stop();
  }

  private signalHandlers(role: Role): SignalHandlers {
    return {
      onMessage: (message) => {
        void this.handleSignal(role, message);
      },
      onError: (error) => this.connectedReject?.(error),
    };
  }

  private async handleSignal(role: Role, message: SignalMessage): Promise<void> {
    try {
      if (message.type === 'offer' && role === 'responder') {
        await this.handleOffer(message);
      } else if (message.type === 'answer' && role === 'initiator') {
        await this.handleAnswer(message);
      } else if (message.type === 'ice') {
        await this.handleIce(message.candidate);
      }
    } catch (error) {
      this.connectedReject?.(error as Error);
    }
  }

  private async handleOffer(message: Extract<SignalMessage, { type: 'offer' }>): Promise<void> {
    this.peerPublicKey = message.publicKey;
    this.offerSdp = message.sdp;

    const pc = this.createPeerConnection();
    await this.attachLocalAudio(pc);
    await pc.setRemoteDescription({ type: 'offer', sdp: message.sdp });

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    const answerSdp = pc.localDescription?.sdp ?? answer.sdp;
    const sig = await encryptionService.sign(utf8ToBase64(answerSdp));

    await this.computeSas();
    await signalingService.send({
      type: 'answer',
      sdp: answerSdp,
      publicKey: this.localPublicKey as string,
      sig,
    });
  }

  private async handleAnswer(message: Extract<SignalMessage, { type: 'answer' }>): Promise<void> {
    const valid = await encryptionService.verify(
      message.publicKey,
      message.sig,
      utf8ToBase64(message.sdp),
    );
    if (!valid) {
      this.connectedReject?.(new Error('Peer identity signature is invalid'));
      return;
    }
    this.peerPublicKey = message.publicKey;
    await this.pc?.setRemoteDescription({ type: 'answer', sdp: message.sdp });
    await this.computeSas();
  }

  private async handleIce(candidate: string): Promise<void> {
    if (!this.pc) return;
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
    } catch {
      // ICE can arrive before the remote description; safe to drop.
    }
  }

  private createPeerConnection(): RTCPeerConnection {
    // No STUN/TURN: host candidates only, so traffic stays on the LAN (PRD §1).
    const pc = new RTCPeerConnection({ iceServers: [] });
    this.pc = pc;

    listen<{ candidate: RTCIceCandidate | null }>(pc, 'icecandidate', (event) => {
      if (event.candidate) {
        void signalingService.send({
          type: 'ice',
          candidate: JSON.stringify(event.candidate.toJSON()),
        });
      }
    });

    listen<unknown>(pc, 'connectionstatechange', () => {
      const state = pc.connectionState;
      if (state === 'connected') {
        this.onConnected();
      } else if (state === 'failed' || state === 'closed') {
        this.connectedReject?.(new Error('Peer connection failed'));
      }
    });

    listen<{ channel: DataChannel }>(pc, 'datachannel', (event) => {
      this.setupChannel(event.channel);
    });

    return pc;
  }

  private async attachLocalAudio(pc: RTCPeerConnection): Promise<void> {
    if (!this.localStream) {
      this.localStream = await mediaDevices.getUserMedia({ audio: true });
      // Push-to-talk: start muted until the user holds the talk button.
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
    }
    const stream = this.localStream;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
  }

  private setupChannel(channel: DataChannel): void {
    this.chat = channel;
    listen<{ data: string | ArrayBuffer | Blob }>(channel, 'message', (event) => {
      if (typeof event.data === 'string') {
        this.handleChat(event.data);
      }
    });
    listen<unknown>(channel, 'open', () => {
      void this.sendMeta();
    });
  }

  private handleChat(raw: string): void {
    let envelope: ChatEnvelope;
    try {
      envelope = JSON.parse(raw) as ChatEnvelope;
    } catch {
      return;
    }
    if (envelope.t === 'msg') {
      const incoming: Message = { ...envelope.message, direction: 'received', status: 'delivered' };
      this.messageListeners.forEach((cb) => cb(incoming));
    } else if (envelope.t === 'meta') {
      this.peerName = envelope.name;
      this.peerBattery = envelope.battery;
    }
  }

  private async sendMeta(): Promise<void> {
    const channel = this.chat;
    if (!channel || channel.readyState !== 'open') return;
    const envelope: ChatEnvelope = {
      t: 'meta',
      name: Device.deviceName ?? 'LocalLink',
      battery: await this.readBatteryPercent(),
    };
    channel.send(JSON.stringify(envelope));
  }

  private onConnected(): void {
    this.connectedResolve?.();
    this.connectedResolve = null;
    this.connectedReject = null;
    this.startLatencyLoop();
  }

  private async computeSas(): Promise<void> {
    if (!this.localPublicKey || !this.peerPublicKey || !this.offerSdp) return;
    this.sas = await encryptionService.deriveSas(
      this.localPublicKey,
      this.peerPublicKey,
      this.offerSdp,
    );
  }

  private armConnected(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.connectedResolve = resolve;
      this.connectedReject = reject;
    });
  }

  private startLatencyLoop(): void {
    if (this.latencyTimer) return;
    this.latencyTimer = setInterval(() => {
      void this.pollLatency();
    }, 2000);
  }

  private async pollLatency(): Promise<void> {
    const pc = this.pc;
    if (!pc) return;
    try {
      const stats = await pc.getStats();
      let rttMs = 0;
      stats.forEach((report: StatsReport) => {
        if (
          report.type === 'candidate-pair' &&
          (report.nominated || report.selected || report.state === 'succeeded') &&
          typeof report.currentRoundTripTime === 'number'
        ) {
          rttMs = Math.round(report.currentRoundTripTime * 1000);
        }
      });
      if (rttMs > 0) {
        this.latencyListeners.forEach((cb) => cb(rttMs));
      }
    } catch {
      // getStats can throw mid-teardown; ignore.
    }
  }

  private async buildSession(): Promise<CallSession> {
    return {
      peerName: this.peerName,
      mode: 'wifi-direct',
      latencyMs: 0,
      encrypted: true,
      startedAt: Date.now(),
      selfBattery: await this.readBatteryPercent(),
      peerBattery: this.peerBattery,
    };
  }

  private async readBatteryPercent(): Promise<number> {
    try {
      const level = await Battery.getBatteryLevelAsync();
      return level >= 0 ? Math.round(level * 100) : 100;
    } catch {
      return 100;
    }
  }
}

export const peerSession = new PeerSession();
