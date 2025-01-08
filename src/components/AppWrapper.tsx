"use client";

import React, {useEffect, useState} from 'react'
import {ThemeProvider} from "@/components/theme-provider";
import {ChatProvider} from "@/context/ChatContext";

type props = {
  children: React.ReactNode;
}
const AppWrapper = ({children}: props) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      storageKey="theme-mode"
    >
      <ChatProvider>
        {children}
      </ChatProvider>
    </ThemeProvider>
  )
}
export default AppWrapper
