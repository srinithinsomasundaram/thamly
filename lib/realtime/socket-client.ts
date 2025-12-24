"use client"

import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

const SOCKET_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SOCKET === "true"
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL

export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null
  if (!SOCKET_ENABLED) return null
  if (!SOCKET_URL) return null

  if (!socket) {
    socket = io(SOCKET_URL, {
      path: process.env.NEXT_PUBLIC_SOCKET_PATH || "/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: false,
    })
  }

  return socket
}
