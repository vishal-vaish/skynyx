"use client";

import React, {useEffect, useState} from 'react'
import {Textarea} from "@/components/ui/textarea";
import {SpeechRecognitionEvent} from "@/types/speech-recognition";
import WaveformSvg from "@/app/_component/WaveformSvg";

type Props = {
  audioContext: AudioContext | null;
  stream: MediaStream | null;
}

const ClientAudioContainer = ({audioContext, stream}:Props) => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if(audioContext) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            transcript += result[0].transcript;
          }
          setMessage(transcript.trim());
        };

        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
        };

        recognition.start();

        return () => {
          recognition.stop();
        };
      } else {
        console.warn("SpeechRecognition API is not supported in this browser.");
      }
    }
  }, [audioContext]);

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
