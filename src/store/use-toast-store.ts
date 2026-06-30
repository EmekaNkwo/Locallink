import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
};

type ToastInput = {
  type: ToastType;
  message: string;
  duration?: number;
};

type ToastState = {
  toasts: Toast[];
  show: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

const DEFAULT_DURATION = 3200;
const MAX_VISIBLE = 3;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: ({ type, message, duration = DEFAULT_DURATION }) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration }].slice(-MAX_VISIBLE),
    }));
    return id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/** Convenience API callable from anywhere (stores, services, screens). */
export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().show({ type: 'success', message, duration }),
  error: (message: string, duration?: number) =>
    useToastStore.getState().show({ type: 'error', message, duration }),
  info: (message: string, duration?: number) =>
    useToastStore.getState().show({ type: 'info', message, duration }),
};
