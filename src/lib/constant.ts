export const WS_ENDPOINTS = {
  CLIENT_AUDIO: 'ws://192.168.10.10:8000/ws/audio',
  CLIENT_TEXT: 'ws://192.168.10.10:8000/ws/transcript',
  AGENT_TEXT: 'ws://192.168.10.10:8000/ws/llm_response',
  AGENT_AUDIO: 'ws://192.168.10.10:8000/ws/tts_audio',
} as const;