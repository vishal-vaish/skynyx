"use client";

import React, {useEffect, useState} from "react";
import {Textarea} from "@/components/ui/textarea";
import useWebSocket from "@/hooks/useWebSockets";
import {WS_ENDPOINTS} from "@/lib/constant";
import WaveformSvg from "@/app/_component/WaveformSvg";

type Props = {
  audioContext: AudioContext | null;
  stream: MediaStream | null;
  connected: boolean;
}

const ClientAudioContainer = ({audioContext, stream, connected}: Props) => {
  const [message, setMessage] = useState<string>("");

  const {connect,disconnect, response} = useWebSocket(WS_ENDPOINTS.CLIENT_TEXT);

  useEffect(() => {
    if (connected) {
      connect();
    } else {
      disconnect();
    }
  }, [connected]);

  useEffect(() => {
    if (typeof response === "string")
      setMessage(response);
  }, [response]);

  return (
    <div className="flex items-center justify-center w-full h-full p-4 border-b flex-col">
      <div className="text-base font-bold">Live Audio Transcription</div>
      <div>
        <WaveformSvg audioContext={audioContext} stream={stream}/>
      </div>
      <div className="w-full h-full">
        <Textarea
          value={message}
          className="h-full resize-none text-lg"
          readOnly
        />
      </div>
    </div>
  )
}
export default ClientAudioContainer