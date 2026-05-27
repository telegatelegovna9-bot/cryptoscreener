// ============================================
// Alert Store (Zustand)
// Real-time alerts and notifications
// ============================================

import { create } from 'zustand';

export interface AlertItem {
  id: string;
  type: string;
  symbol: string;
  exchange: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  read: boolean;
}

interface AlertState {
  alerts: AlertItem[];
  unreadCount: number;
  popupAlerts: AlertItem[];
  addAlert: (alert: AlertItem) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissPopup: (id: string) => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  unreadCount: 0,
  popupAlerts: [],

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts],
      unreadCount: state.unreadCount + 1,
      popupAlerts: [...state.popupAlerts, alert].slice(-5),
    })),

  markAsRead: (id) =>
    set((state) => {
      const alert = state.alerts.find((a) => a.id === id);
      if (!alert || alert.read) return state;
      return {
        alerts: state.alerts.map((a) =>
          a.id === id ? { ...a, read: true } : a,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      alerts: state.alerts.map((a) => ({ ...a, read: true })),
      unreadCount: 0,
    })),

  dismissPopup: (id) =>
    set((state) => ({
      popupAlerts: state.popupAlerts.filter((a) => a.id !== id),
    })),
}));
