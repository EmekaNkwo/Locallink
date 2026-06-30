import type { SignalHandlers, SignalingService, SignalMessage } from './signaling-service.types';

/** Web/preview mock: signaling is native-only; these are inert no-ops. */
class MockSignalingService implements SignalingService {
  async startServer(_handlers: SignalHandlers): Promise<void> {}
  async connect(_host: string, _port: number, _handlers: SignalHandlers): Promise<void> {}
  async send(_message: SignalMessage): Promise<void> {}
  async stop(): Promise<void> {}
}

export const signalingService: SignalingService = new MockSignalingService();
