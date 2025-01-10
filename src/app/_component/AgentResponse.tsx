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

const AgentResponse = ({connected, isUserSpeaking}: Props) => {
  const [message, setMessage] = useState<string>("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const {connect, disconnect, response} = useWebSocket(WS_ENDPOINTS.AGENT_TEXT);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const {
    connect: audioConnect,
    disconnect: audioDisconnect,
    response: audioResponse
  } = useWebSocket(WS_ENDPOINTS.AGENT_AUDIO);
  const {addMessage} = useChat();

  useEffect(() => {
    if (connected) {
      connect();
      audioConnect();
    } else {
      disconnect();
      audioDisconnect();
    }
  }, [connected]);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    setStream(null);
  };

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
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioContext = audioContextRef.current;
        if (!audioContext) {
          throw new Error('AudioContext not initialized');
        }

        stopAudio();

        const audioBuffer = await audioContext.decodeAudioData(data);
        const mediaStreamDestination = audioContext.createMediaStreamDestination();
        const source = audioContext.createBufferSource();
        audioSourceRef.current = source;
        source.buffer = audioBuffer;
        source.connect(mediaStreamDestination);
        source.connect(audioContext.destination);
        source.start(0);

        setStream(mediaStreamDestination.stream);

        source.onended = () => {
          audioSourceRef.current = null;
          setStream(null);
        };
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
        <WaveformSvg audioContext={audioContextRef.current} stream={stream}/>
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