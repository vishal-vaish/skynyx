"use client"

import useWebSocket from "@/hooks/useWebSockets";
import {WS_ENDPOINTS} from "@/lib/constant";
import {useEffect, useRef, useState} from "react";
import ClientAudioContainer from "@/app/_component/ClientAudioContainer";
import AgentResponse from "@/app/_component/AgentResponse";
import Chat from "@/app/_component/Chat";
import {getAudioChunkerWorkletUrl} from "@/lib/audioChunkerWorklet";
import Header from "@/app/_component/Header";

export default function Page() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState<boolean>(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {isConnected, connect, disconnect, send} = useWebSocket(WS_ENDPOINTS.CLIENT_AUDIO);

  const handleConnect = () => {
    connect();
  }

  const handleDisconnect = () => {
    disconnect();
  }

  const detectSpeaking = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;

    const VOLUME_THRESHOLD = 40;

    if (average > VOLUME_THRESHOLD) {
      setIsUserSpeaking(true);
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      silenceTimeoutRef.current = setTimeout(() => {
        setIsUserSpeaking(false);
      }, 500);
    }

    animationFrameRef.current = requestAnimationFrame(detectSpeaking);
  };

  useEffect(() => {
    if (isConnected) {
      startRecording();
      setConnected(true);
    } else {
      stopRecording();
      setConnected(false);
    }
  }, [isConnected]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      await createAudioProcessor();
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const createAudioProcessor = async () => {
    const audioContext = new AudioContext({
      sampleRate: 16000,
      latencyHint: "interactive"
    });
    audioContextRef.current = audioContext;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      }
    });

    streamRef.current = stream;
    setStream(stream);
    const workletUrl = getAudioChunkerWorkletUrl();

    await audioContext.audioWorklet.addModule(workletUrl);
    const source = audioContext.createMediaStreamSource(stream);

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;

    const workletNode = new AudioWorkletNode(audioContext, "audio-chunker");

    workletNode.port.onmessage = (event) => {
      send(event.data);
    };

    source.connect(analyser);
    source.connect(workletNode).connect(audioContext.destination);
    audioWorkletNodeRef.current = workletNode;

    detectSpeaking();

    URL.revokeObjectURL(workletUrl);
  };

  const stopRecording = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    setIsUserSpeaking(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header
        isConnected={isConnected}
        handleDisconnect={handleDisconnect}
        handleConnect={handleConnect}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 flex flex-col border-r dark:border-white/20">
          <ClientAudioContainer
            audioContext={audioContextRef.current}
            stream={stream}
            connected={connected}
          />
          <AgentResponse
            connected={connected}
            isUserSpeaking={isUserSpeaking}
          />
        </div>
        <div className="w-1/2 p-4 overflow-y-auto">
          <Chat/>
        </div>
      </div>
    </div>
  );
}