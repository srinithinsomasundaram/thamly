"use client"

import { useEffect } from "react"
import type { Socket } from "socket.io-client"

export function useSocketEvent<T = any>(socket: Socket | null, event: string, handler: (payload: T) => void) {
  useEffect(() => {
    if (!socket) return
    socket.on(event, handler)
    return () => {
      socket.off(event, handler)
    }
  }, [socket, event, handler])
}
