import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import type { WSMessage } from "../types/robot";

interface ConnectionContextType {
  connected: boolean;
  lastMessage: WSMessage | null;
  sendMessage: (data: unknown) => void;
}

const ConnectionContext = createContext<ConnectionContextType>({
  connected: false,
  lastMessage: null,
  sendMessage: () => {},
});

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8766";
const RECONNECT_DELAY_MS = 2000;

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onclose = () => {
        setConnected(false);
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      ws.onerror = () => ws.close();

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as WSMessage;
          setLastMessage(msg);
        } catch { /* ignore malformed messages */ }
      };
    } catch {
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return (
    <ConnectionContext.Provider value={{ connected, lastMessage, sendMessage }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  return useContext(ConnectionContext);
}
