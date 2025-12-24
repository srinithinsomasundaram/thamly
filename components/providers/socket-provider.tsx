"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { Socket } from "socket.io-client"
import { getSocket } from "@/lib/realtime/socket-client"

type SocketContextValue = {
  socket: Socket | null
  connected: boolean
}

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false })

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false)
  const socket = useMemo(() => getSocket(), [])

  if (!socket) {
    return <>{children}</>
  }

  useEffect(() => {
    if (!socket) return

    const handleConnect = () => {
      setConnected(true)
      socket.emit("app:hydrate")
    }
    const handleDisconnect = () => setConnected(false)

    socket.connect()
    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)

    return () => {
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
    }
  }, [socket])

  const value = useMemo(() => ({ socket, connected }), [socket, connected])

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket() {
  return useContext(SocketContext)
}
