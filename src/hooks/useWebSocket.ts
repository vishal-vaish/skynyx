import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWebSocketOptions {
  onMessage?: (event: MessageEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (event: Event) => void;
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export const useWebSocket = (
  url: string,
  options: UseWebSocketOptions = {}
) => {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnect = false,
    reconnectAttempts = 3,
    reconnectInterval = 5000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const reconnectTimeoutId = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already connected');
      return;
    }

    try {
      const socket = new WebSocket(url);
      ws.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectCount.current = 0;
        onOpen?.();
      };

      socket.onclose = () => {
        console.log('WebSocket closed');
        setIsConnected(false);
        onClose?.();

        if (reconnect && reconnectCount.current < reconnectAttempts) {
          reconnectCount.current += 1;
          reconnectTimeoutId.current = setTimeout(connect, reconnectInterval);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };

      socket.onmessage = (event) => {
        onMessage?.(event);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [url, onMessage, onOpen, onClose, onError, reconnect, reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
    }

    if (ws.current) {
      ws.current.close();
      ws.current = null;
      setIsConnected(false);
    }
  }, []);

  const send = useCallback((data: string | ArrayBuffer | Blob) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(data);
    } else {
      console.error('WebSocket is not connected');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connect,
    disconnect,
    send
  };
};