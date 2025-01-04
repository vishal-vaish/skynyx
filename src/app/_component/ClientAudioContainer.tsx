"use client";

import React, {useState} from 'react'
import {Textarea} from "@/components/ui/textarea";
import WaveformSvg from "@/app/_component/WaveformSvg";

type Props = {
  audioContext: AudioContext | null;
  stream: MediaStream | null;
}

const ClientAudioContainer = ({audioContext, stream}:Props) => {
  const [message, setMessage] = useState("");


  return (
    <div className="flex items-center justify-center w-full h-full p-4 border-b flex-col">
      <div className="">
        <WaveformSvg audioContext={audioContext} stream={stream} />
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
export default ClientAudioContainer
