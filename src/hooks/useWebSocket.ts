import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketOptions {
  onMessage?: (event: MessageEvent, endpoint: string) => void;
  onOpen?: (endpoint: string) => void;
  onClose?: (endpoint: string) => void;
  onError?: (endpoint: string, error: Event) => void;
}

export const useWebSocket = (
  endpoints: Record<string, string>,
  options: WebSocketOptions = {}
) => {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
  } = options;

  const connections = useRef<Record<string, WebSocket | null>>({});
  const connectionStates = useRef<Record<string, boolean>>({});
  const [isConnected, setIsConnected] = useState<Record<string, boolean>>({});
  // const [responses, setResponses] = useState<Record<string, any>>({});
  const isConnectedRef = useRef(isConnected);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  const connect = useCallback(() => {
    Object.entries(endpoints).forEach(([key, url]) => {
      if (connections.current[key]?.readyState === WebSocket.OPEN) {
        console.log(`WebSocket ${key} is already connected`);
        return;
      }

      try {
        const socket = new WebSocket(url);
        connections.current[key] = socket;

        socket.onopen = () => {
          console.log(`WebSocket connected: ${key}`);
          connectionStates.current[key] = true;
          setIsConnected((prev) => ({ ...prev, [key]: true }));
          onOpen?.(key);
        };

        socket.onclose = () => {
          console.log(`WebSocket disconnected: ${key}`);
          connectionStates.current[key] = false;
          setIsConnected((prev) => ({ ...prev, [key]: false }));
          onClose?.(key);
        };

        socket.onerror = (error) => {
          console.error(`WebSocket error (${key}):`, error);
          onError?.(key, error);
        };

        socket.onmessage = (event) => {
          console.log(`Message received on ${key}:`, event.data);
          // setResponses((prev) => ({ ...prev, [key]: event.data }))
          onMessage?.(event, key);
        };
      } catch (error) {
        console.error(`Failed to connect WebSocket (${key}):`, error);
      }
    });
  }, [endpoints, onMessage, onOpen, onClose, onError]);


  const disconnect = useCallback(() => {
    Object.keys(connections.current).forEach((key) => {
      const socket = connections.current[key];
      if (socket) {
        socket.close();
        connections.current[key] = null;
        connectionStates.current[key] = false;
      }
    });
    setIsConnected({});
  }, []);

  const send = useCallback(
    (endpoint: keyof typeof endpoints, data: string | ArrayBuffer | Blob) => {
      if (!isConnectedRef.current[endpoint]) return;
      const socket = connections.current[endpoint];
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(data);
      } else {
        console.error(`WebSocket (${endpoint}) is not connected`);
      }
    },
    []
  );

  // const endpointResponse = useCallback(
  //   (endpoint: keyof typeof endpoints) => {
  //     // const response = responses[endpoint];
  //     if (!response) {
  //       // console.error(`No response stored for endpoint: ${endpoint}`);
  //       return;
  //     }
  //     send(endpoint, response); // Send the response back to the server
  //   },
  //   [responses, send]
  // );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  console.log(isConnected);

  return {
    isConnected,
    connect,
    disconnect,
    send,
    // endpointResponse
  };
};