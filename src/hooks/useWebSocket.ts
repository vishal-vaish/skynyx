import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketOptions {
  onMessage?: (event: MessageEvent, endpoint: string) => void;
  onOpen?: (endpoint: string) => Promise<void> | void;
  onClose?: (endpoint: string) => void;
  onError?: (endpoint: string, error: Event) => void;
}

interface WebSocketConnection {
  socket: WebSocket;
  bufferQueue: Array<string | ArrayBuffer | Blob>;
  isConnecting: boolean;
}

export const useWebSocket = (
  endpoints: Record<string, string>,
  options: WebSocketOptions = {}
) => {
  const { onMessage, onOpen, onClose, onError } = options;

  const connections = useRef<Record<string, WebSocketConnection>>({});
  const [isConnected, setIsConnected] = useState<Record<string, boolean>>({});

  const isConnectedRef = useRef(isConnected);
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  const createConnection = useCallback((key: string, url: string) => {
    if (connections.current[key]?.socket?.readyState === WebSocket.OPEN) {
      console.log(`WebSocket ${key} is already connected`);
      return;
    }

    try {
      const socket = new WebSocket(url);

      connections.current[key] = {
        socket,
        bufferQueue: [],
        isConnecting: true
      };

      socket.onopen = async () => {
        console.log(`WebSocket connected: ${key}`);
        const connection = connections.current[key];
        connection.isConnecting = false;

        while (connection.bufferQueue.length > 0) {
          const data = connection.bufferQueue.shift();
          if (data) socket.send(data);
        }

        setIsConnected(prev => ({ ...prev, [key]: true }));
        await onOpen?.(key);
      };

      socket.onclose = () => {
        console.log(`WebSocket disconnected: ${key}`);
        setIsConnected(prev => ({ ...prev, [key]: false }));
        onClose?.(key);
      };

      socket.onerror = (error) => {
        console.error(`WebSocket error (${key}):`, error);
        onError?.(key, error);
      };

      socket.onmessage = (event) => {
        onMessage?.(event, key);
      };

    } catch (error) {
      console.error(`Failed to connect WebSocket (${key}):`, error);
    }
  }, [onMessage, onOpen, onClose, onError]);

  const connect = useCallback(() => {
    Object.entries(endpoints).forEach(([key, url]) => {
      createConnection(key, url);
    });
  }, [endpoints, createConnection]);

  const disconnect = useCallback(() => {
    Object.entries(connections.current).forEach(([key, connection]) => {
      if (connection.socket) {
        connection.socket.close();
        delete connections.current[key];
      }
    });
    setIsConnected({});
  }, []);

  const send = useCallback(
    (endpoint: keyof typeof endpoints, data: string | ArrayBuffer | Blob) => {
      const connection = connections.current[endpoint];

      if (!connection) {
        console.error(`No connection found for endpoint: ${endpoint}`);
        return;
      }

      if (connection.isConnecting) {
        connection.bufferQueue.push(data);
        return;
      }

      if (connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.send(data);
      } else {
        console.error(`WebSocket (${endpoint}) is not connected`);
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connect,
    disconnect,
    send,
  };
};