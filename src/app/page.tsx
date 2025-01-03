"use client"

import {Button} from "@/components/ui/button";
import {useRef} from "react";
import {cn} from "@/lib/utils";
import ClientAudioContainer from "@/app/_component/ClientAudioContainer";
import {useWebSocket} from "@/hooks/useWebSocket";
import {WS_ENDPOINTS} from "@/types/websocketConstant";

export default function Page() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);

  const { isConnected, connect, disconnect, send } = useWebSocket(
    WS_ENDPOINTS.CLIENT_AUDIO,
    {
      onOpen: async () => {
        console.log('Audio WebSocket connected');
        await startRecording();
      },
      onClose: () => {
        console.log('Audio WebSocket closed');
        stopRecording();
      },
      onError: (error) => {
        console.error('Audio WebSocket error:', error);
        stopRecording();
      }
    }
  );

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

    const workletCode = `
      class AudioChunker extends AudioWorkletProcessor {
        constructor() {
          super();
          this.bufferSize = 1536; // Match Python"s chunk size
          this.buffer = new Float32Array(this.bufferSize);
          this.bufferIndex = 0;
        }

        process(inputs, outputs, parameters) {
          const input = inputs[0][0];
          if (!input) return true;

          for (let i = 0; i < input.length; i++) {
            this.buffer[this.bufferIndex++] = input[i];
            
            if (this.bufferIndex >= this.bufferSize) {
              // Convert to 16-bit integers to match Python"s paInt16
              const int16Array = new Int16Array(this.bufferSize);
              for (let j = 0; j < this.bufferSize; j++) {
                int16Array[j] = Math.max(-32768, Math.min(32767, this.buffer[j] * 32768));
              }
              
              this.port.postMessage(int16Array.buffer);
              this.bufferIndex = 0;
            }
          }
          return true;
        }
      }
      registerProcessor("audio-chunker", AudioChunker);
    `;

    const blob = new Blob([workletCode], {type: "application/javascript"});
    const workletUrl = URL.createObjectURL(blob);

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
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-100 p-4 flex justify-between items-center">
        <Button
          onClick={isConnected ? disconnect : connect}
          // onClick={isConnected ? disconnectWebSocket : startRecording}
        >
          {isConnected ? "Disconnect" : "Connect"}
        </Button>

        <div className="flex justify-center items-center gap-2">
          <div className={cn("w-4 h-4 rounded-full",
            isConnected ? "bg-green-500" : "bg-red-500",
          )}
          />
          <div className="text-muted-foreground">
            {isConnected ? "Connected" : "Disconnected"}
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 flex flex-col border-r">
          <ClientAudioContainer
            audioContext={audioContextRef.current}
            stream={streamRef.current}
          />
          {/*<ClientAudioContainer*/}
          {/*  audioContext={audioContextRef.current}*/}
          {/*  stream={streamRef.current}*/}
          {/*  volumeRef={volumeRef}*/}
          {/*/>*/}
        </div>
        <div className="w-1/2 p-4 overflow-y-auto">
          <div>Chatting</div>
        </div>
      </div>
    </div>
  );
}