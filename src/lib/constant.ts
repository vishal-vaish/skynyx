const BASE_URL = 'ws://192.168.10.10:8000/ws';

export const WS_ENDPOINTS = {
  CLIENT_AUDIO: `${BASE_URL}/audio`,
  CLIENT_TEXT: `${BASE_URL}/transcript`,
  AGENT_TEXT: `${BASE_URL}/llm_response`,
  AGENT_AUDIO: `${BASE_URL}/tts_audio`,
} as const;
