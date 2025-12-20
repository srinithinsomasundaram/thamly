const { createServer } = require("http")
const { Server } = require("socket.io")

const port = Number(process.env.SOCKET_PORT || 4000)
const corsOrigin = process.env.CORS_ORIGIN || "*"

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
  },
  path: process.env.NEXT_PUBLIC_SOCKET_PATH || "/socket.io",
})

io.on("connection", (socket) => {
  socket.on("app:hydrate", () => {
    socket.emit("app:ready", { ts: Date.now() })
  })

  socket.on("shell:ready", (payload) => {
    socket.broadcast.emit("shell:online", payload)
  })

  socket.on("profile:ready", (payload) => {
    socket.broadcast.emit("profile:update", payload)
  })
})

httpServer.listen(port, () => {
  console.log(`[socket] server running on ${port}`)
})
