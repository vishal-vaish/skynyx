import React from 'react'
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Power} from "lucide-react";
import {ModeToggle} from "@/components/ModeToggle";

type Props = {
  isConnected: boolean;
  handleDisconnect: () => void;
  handleConnect: () => void;
}

const Header = ({isConnected, handleConnect, handleDisconnect}:Props) => {
  return (
    <header className="bg-background p-2 flex justify-between items-center border-b dark:border-white/20">
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
  )
}
export default Header
