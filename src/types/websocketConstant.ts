export const WS_ENDPOINTS = {
  CLIENT_AUDIO: 'ws://192.168.10.10:8000/ws/audio',
} as const;

export enum WS_ENDPOINT_ENUM {
  CLIENT_AUDIO = "CLIENT_AUDIO",
  CLIENT_TEXT = "CLIENT_TEXT"
}