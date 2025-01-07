import {useState, useCallback} from 'react';

interface UseWebSocketReturn {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  send: (message: string) => void;
  response: string | ArrayBuffer | null;
}

const useWebSocket = (endpoint: string): UseWebSocketReturn => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [response, setResponse] = useState<string | ArrayBuffer | null>(null);

  const connect = useCallback(() => {
    if (!isConnected && endpoint) {
      const socketInstance = new WebSocket(endpoint);
      socketInstance.binaryType = "arraybuffer";

      socketInstance.onopen = () => {
        setIsConnected(true);
        console.log(`Connected to ${endpoint}`);
      };

      socketInstance.onclose = () => {
        setIsConnected(false);
        setResponse(null);
        console.log(`Disconnected from ${endpoint}`);
      };

      socketInstance.onerror = (error) => {
        console.error(`WebSocket error: ${error}`);
      };

      socketInstance.onmessage = (event) => {
        try {
          if (event.data instanceof ArrayBuffer) {
            setResponse(event.data);
          } else if (typeof event.data === 'string') {
            const message = JSON.parse(event.data);
            if (message.text) {
              setResponse(message.text);
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      setSocket(socketInstance);
    }
  }, [endpoint, isConnected]);

  const disconnect = useCallback(() => {
    if (socket && isConnected) {
      socket.close();
      setIsConnected(false);
    }
  }, [socket, isConnected]);

  const send = useCallback((message: string | ArrayBuffer | Blob) => {
    if (socket && isConnected) {
      socket.send(message);
    }
  }, [socket, isConnected]);

  return {
    isConnected,
    connect,
    disconnect,
    send,
    response,
  };
};

export default useWebSocket;
