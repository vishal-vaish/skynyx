"use client";

import React, {useEffect, useRef} from 'react'
import {Card} from "@/components/ui/card";
import {useChat} from "@/context/ChatContext";
import { User, Bot } from 'lucide-react';
import {Avatar, AvatarFallback} from "@/components/ui/avatar";

const Chat = () => {
  const {messages} = useChat();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if(messages.length === 0) {
    return (
      <Card className="p-4 h-full overflow-hidden bg-background dark:border-white/20">
        <div className="mb-4 text-center font-bold text-xl">Chat History</div>
        <div
          className="flex h-full w-full justify-center items-center"
        >
          No Chat History
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 h-full overflow-hidden bg-background">
      <div className="mb-4 text-center font-bold text-xl">Chat History</div>
      <div
        ref={chatContainerRef}
        className="space-y-4 overflow-y-auto h-full custom-scrollbar pb-10"
      >
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
    </Card>
  )
}
export default Chat

interface ChatMessageProps {
  message: {
    id: string
    text: string
    type: "user" | "assistant"
    timestamp: string
  }
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div
      className={`flex items-start ${
        message.type === "user" ? "justify-end" : "justify-start"
      } mb-4 gap-2`}
    >
      {message.type === "assistant" && (
        <Avatar className="w-8 h-8">
          <AvatarFallback><Bot className="w-4 h-4"/></AvatarFallback>
        </Avatar>
      )}
      <div
        className={`max-w-[80%] p-3 rounded-lg ${
          message.type === "user"
            ? "bg-blue-500 text-white dark:bg-blue-600"
            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white"
        }`}
      >
        <p className="text-sm">{message.text}</p>
        <span className="text-xs opacity-70 mt-1 block">
           {message.timestamp}
        </span>
      </div>
      {message.type === "user" && (
        <Avatar className="w-8 h-8">
          <AvatarFallback><User className="w-4 h-4"/></AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
