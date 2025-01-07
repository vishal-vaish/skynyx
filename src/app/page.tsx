"use client"

import useWebSocket from "@/hooks/useWebSockets";
import {WS_ENDPOINTS} from "@/lib/constant";
import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";
import {useEffect, useRef, useState} from "react";
import ClientAudioContainer from "@/app/_component/ClientAudioContainer";
import AgentResponse from "@/app/_component/AgentResponse";
import Chat from "@/app/_component/Chat";
import {Power} from "lucide-react";
import {ModeToggle} from "@/components/ModeToggle";
import {getAudioChunkerWorkletUrl} from "@/lib/audioChunkerWorklet";

export default function Page() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  const {isConnected, connect, disconnect, send} = useWebSocket(WS_ENDPOINTS.CLIENT_AUDIO);

  const handleConnect = () => {
    connect();
  }

  const handleDisconnect = () => {
    disconnect();
  }

  useEffect(() => {
    if (isConnected) {
      startRecording();
      setConnected(true);
    } else {
      stopRecording();
      setConnected(false);
    }
  }, [isConnected]);

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
    const workletNode = new AudioWorkletNode(audioContext, "audio-chunker");

    workletNode.port.onmessage = (event) => {
      send(event.data);
    };

    source.connect(workletNode).connect(audioContext.destination);
    audioWorkletNodeRef.current = workletNode;

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
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-background p-2 flex justify-between items-center border-b">
        <div className={"relative p-4"}>
          <h1
            className="font-bold text-2xl tracking-tight animate-gradient bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent bg-300% dark:from-purple-300 dark:via-pink-400 dark:to-blue-400">
            SKYNYX-UI
          </h1>
          <div
            className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-500/20 to-blue-500/20 blur-3xl -z-10 animate-pulse dark:from-purple-300/10 dark:via-pink-400/10 dark:to-blue-400/10"/>
        </div>
        <div className="flex gap-5 pr-2">
          <div className="flex justify-center items-center gap-2">
            <div className={cn("w-4 h-4 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500",
            )}
            />
            <div className="text-muted-foreground">
              {isConnected ? "Connected" : "Disconnected"}
            </div>
          </div>
          <Button
            variant={isConnected ? "destructive" : "outline"}
            onClick={isConnected ? handleDisconnect : handleConnect}
            className="gap-1"
          >
            <Power className="mr-2 h-4 w-4"/>
            {isConnected ? "Disconnect" : "Connect"}
          </Button>
          <ModeToggle/>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 flex flex-col border-r">
          <ClientAudioContainer
            audioContext={audioContextRef.current}
            stream={stream}
            connected={connected}
          />
          <AgentResponse connected={connected}/>
        </div>
        <div className="w-1/2 p-4 overflow-y-auto">
          <Chat/>
        </div>
      </div>
    </div>
  );
}