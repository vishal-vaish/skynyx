import React, {useEffect, useState} from 'react'
import useWebSocket from "@/hooks/useWebSockets";
import {WS_ENDPOINTS} from "@/lib/constant";
import {Textarea} from "@/components/ui/textarea";

type Props = {
  connected: boolean;
}

const AgentResponse = ({connected}:Props) => {
  const [message, setMessage] = useState<string>("");
  const {connect, disconnect, response} = useWebSocket(WS_ENDPOINTS.AGENT_TEXT);

  useEffect(() => {
    if (connected) {
      connect();
    } else {
      disconnect();
    }
  }, [connected]);

  useEffect(() => {
    setMessage(response);
  }, [response]);


  return (
    <div className="flex items-center justify-center w-full h-full p-4 border-b flex-col">
      <div className="">
        {/*<WaveformSvg audioContext={audioContext} stream={stream}/>*/}
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