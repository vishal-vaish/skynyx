"use client"

import React, {useEffect, useRef, useState} from 'react'
import useWebSocket from "@/hooks/useWebSockets";
import {WS_ENDPOINTS} from "@/lib/constant";
import {Textarea} from "@/components/ui/textarea";
import WaveformSvg from "@/app/_component/WaveformSvg";
import {useChat} from "@/context/ChatContext";

type Props = {
  connected: boolean;
  isUserSpeaking?: boolean;
}

const SAMPLE_RATE = 24000;
const CHANNELS = 1;

const AgentResponse = ({connected, isUserSpeaking}: Props) => {
  const [message, setMessage] = useState<string>("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioBufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const mediaStreamDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const audioChunksRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [silenceDetected, setSilenceDetected] = useState<boolean>(false);

  const {connect, disconnect, response} = useWebSocket(WS_ENDPOINTS.AGENT_TEXT);
  const {
    connect: audioConnect,
    disconnect: audioDisconnect,
    response: audioResponse
  } = useWebSocket(WS_ENDPOINTS.AGENT_AUDIO);
  const {addMessage} = useChat();

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: SAMPLE_RATE
      });
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 1.0;
      mediaStreamDestinationRef.current = audioContextRef.current.createMediaStreamDestination();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.connect(mediaStreamDestinationRef.current);
      setStream(mediaStreamDestinationRef.current.stream);
    }
  };

  const stopAudio = () => {
    if (audioBufferSourceRef.current) {
      try {
        audioBufferSourceRef.current.stop();
      } catch (e) {
        console.error(e);
      }
      audioBufferSourceRef.current = null;
    }
    isPlayingRef.current = false;
    audioChunksRef.current = [];
    setSilenceDetected(true);
  };

  const createAudioBuffer = (audioData: Int16Array): AudioBuffer => {
    const audioBuffer = audioContextRef.current!.createBuffer(
      CHANNELS,
      audioData.length,
      SAMPLE_RATE
    );
    const channelData = audioBuffer.getChannelData(0);

    for (let i = 0; i < audioData.length; i++) {
      channelData[i] = audioData[i] / 32768.0;
    }

    return audioBuffer;
  };

  const playAudioChunk = async () => {
    if (!isPlayingRef.current || !audioContextRef.current || audioChunksRef.current.length === 0) {
      return;
    }

    const chunk = audioChunksRef.current.shift();
    if (!chunk) return;

    const audioBuffer = createAudioBuffer(chunk);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;

    if (gainNodeRef.current) {
      source.connect(gainNodeRef.current);
    }

    audioBufferSourceRef.current = source;
    setSilenceDetected(false);
    const startTime = audioContextRef.current.currentTime;
    source.start(startTime);

    source.onended = () => {
      audioBufferSourceRef.current = null;
      if (audioChunksRef.current.length > 0) {
        playAudioChunk();
      } else {
        isPlayingRef.current = false;
        setSilenceDetected(true);
      }
    };
  };

  useEffect(() => {
    if (connected) {
      connect();
      audioConnect();
      initAudioContext();
    } else {
      disconnect();
      audioDisconnect();
      stopAudio();
    }

    return () => {
      stopAudio();
    };
  }, [connected]);

  useEffect(() => {
    if (isUserSpeaking) {
      stopAudio();
    }
  }, [isUserSpeaking]);

  useEffect(() => {
    if (typeof response === "string") {
      setMessage(response);
      addMessage(response, "assistant");
    }
  }, [response]);

  useEffect(() => {
    const handleAudioMessage = async (data: ArrayBuffer) => {
      try {
        if (!audioContextRef.current) {
          initAudioContext();
        }
        const audioData = new Int16Array(data);
        audioChunksRef.current.push(audioData);

        if (!isPlayingRef.current && audioContextRef.current?.state !== 'suspended') {
          isPlayingRef.current = true;
          playAudioChunk();
        } else if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume();
          isPlayingRef.current = true;
          playAudioChunk();
        }
      } catch (error) {
        console.error('Error processing audio message:', error);
      }
    };

    if (audioResponse instanceof ArrayBuffer) {
      handleAudioMessage(audioResponse);
    }
  }, [audioResponse]);

  return (
    <div className="flex items-center justify-center w-full h-full p-4 border-b flex-col">
      <div className="text-base font-bold">AI Agent</div>
      <div>
        <WaveformSvg
          audioContext={audioContextRef.current}
          stream={stream}
          silenceDetected={silenceDetected}
        />
      </div>
      <div className="w-full h-full">
        <Textarea
          value={message}
          className="h-full resize-none"
          readOnly
        />
      </div>
    </div>
  )
}

export default AgentResponse