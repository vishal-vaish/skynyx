"use client";

import React, {createContext, useContext, useState} from "react";

interface Message {
  id: string;
  text: string;
  type: "user" | "assistant";
  timestamp: string;
}

interface ChatContextProps {
  messages: Message[];
  addMessage: (text: string, type: "user" | "assistant") => void;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = (text: string, type: "user" | "assistant") => {
    const newMessage: Message = {
      id: new Date().toISOString(),
      text,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  return (
    <ChatContext.Provider value={{ messages, addMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};