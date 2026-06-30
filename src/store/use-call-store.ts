import { create } from 'zustand';

import { callService } from '@/services';
import { toast } from '@/store/use-toast-store';
import type { CallSession } from '@/types';

let unsubLatency: (() => void) | null = null;

type CallStatus = 'idle' | 'connecting' | 'active';

type CallState = {
  session: CallSession | null;
  status: CallStatus;
  isTalking: boolean;
  isMuted: boolean;
  isSpeaker: boolean;
  startCall: (peerName: string) => Promise<void>;
  endCall: () => Promise<void>;
  setTalking: (talking: boolean) => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
};

export const useCallStore = create<CallState>((set, get) => ({
  session: null,
  status: 'idle',
  isTalking: false,
  isMuted: false,
  isSpeaker: true,

  startCall: async (peerName) => {
    if (get().status !== 'idle') return;
    set({ status: 'connecting' });
    try {
      const session = await callService.connect(peerName);
      unsubLatency = callService.onLatency((latencyMs) =>
        set((state) => (state.session ? { session: { ...state.session, latencyMs } } : {})),
      );
      set({ session, status: 'active' });
      toast.success(`Secure channel open with ${peerName}`);
    } catch {
      set({ status: 'idle' });
      toast.error(`Could not connect to ${peerName}`);
    }
  },

  endCall: async () => {
    unsubLatency?.();
    unsubLatency = null;
    await callService.disconnect();
    set({ session: null, status: 'idle', isTalking: false, isMuted: false, isSpeaker: false });
  },

  setTalking: (talking) => {
    set({ isTalking: talking });
    callService.setMicEnabled(talking && !get().isMuted);
  },
  toggleMute: () => {
    const nextMuted = !get().isMuted;
    set({ isMuted: nextMuted });
    callService.setMicEnabled(get().isTalking && !nextMuted);
  },
  toggleSpeaker: () => set((state) => ({ isSpeaker: !state.isSpeaker })),
}));
