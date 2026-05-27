// ============================================
// WebSocket Client (Socket.IO)
// Auto-reconnect, heartbeat, channel subscribe
// ============================================

import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? '';

type EventCallback = (...args: unknown[]) => void;

class WebSocketClient {
  private socket: Socket | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private subscribedChannels: Map<string, Set<EventCallback>> = new Map();
  private isConnecting = false;

  connect(): void {
    if (this.socket?.connected || this.isConnecting) return;
    this.isConnecting = true;

    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      this.isConnecting = false;
      this.startHeartbeat();
      this.resubscribeAll();
    });

    this.socket.on('disconnect', () => {
      this.isConnecting = false;
      this.stopHeartbeat();
    });

    this.socket.on('connect_error', () => {
      this.isConnecting = false;
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.subscribedChannels.clear();
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  subscribe(channel: string, callback: EventCallback): void {
    if (!this.subscribedChannels.has(channel)) {
      this.subscribedChannels.set(channel, new Set());
    }
    this.subscribedChannels.get(channel)!.add(callback);

    if (this.socket?.connected) {
      this.socket.emit('subscribe', { channel });
      this.socket.on(channel, callback as (...args: unknown[]) => void);
    }
  }

  unsubscribe(channel: string, callback?: EventCallback): void {
    const callbacks = this.subscribedChannels.get(channel);
    if (!callbacks) return;

    if (callback) {
      callbacks.delete(callback);
      if (this.socket) {
        this.socket.off(channel, callback as (...args: unknown[]) => void);
      }
    } else {
      callbacks.forEach((cb) => {
        if (this.socket) {
          this.socket.off(channel, cb as (...args: unknown[]) => void);
        }
      });
      callbacks.clear();
    }

    if (callbacks.size === 0) {
      this.subscribedChannels.delete(channel);
      if (this.socket?.connected) {
        this.socket.emit('unsubscribe', { channel });
      }
    }
  }

  on(event: string, callback: EventCallback): void {
    this.socket?.on(event, callback as (...args: unknown[]) => void);
  }

  off(event: string, callback: EventCallback): void {
    this.socket?.off(event, callback as (...args: unknown[]) => void);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 25_000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private resubscribeAll(): void {
    if (!this.socket) return;
    for (const [channel, callbacks] of this.subscribedChannels) {
      this.socket.emit('subscribe', { channel });
      for (const cb of callbacks) {
        this.socket.on(channel, cb as (...args: unknown[]) => void);
      }
    }
  }
}

export const wsClient = new WebSocketClient();
