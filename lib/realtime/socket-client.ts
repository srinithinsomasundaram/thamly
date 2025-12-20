"use client"

import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

const defaultUrl = typeof window !== "undefined" ? window.location.origin : ""

export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null

  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || defaultUrl, {
      path: process.env.NEXT_PUBLIC_SOCKET_PATH || "/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: false,
    })
  }

  return socket
}
