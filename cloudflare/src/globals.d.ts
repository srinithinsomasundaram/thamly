export {}

declare global {
  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement
    first<T = any>(): Promise<T | null>
    all<T = any>(): Promise<{ results: T[] }>
    run<T = any>(): Promise<T>
  }

  interface D1Database {
    prepare(query: string): D1PreparedStatement
  }

  interface DurableObjectId {}

  interface DurableObjectStub {
    fetch(request: Request): Promise<Response>
  }

  interface DurableObjectNamespace {
    idFromName(name: string): DurableObjectId
    get(id: DurableObjectId): DurableObjectStub
  }

  interface DurableObjectState {
    blockConcurrencyWhile<T>(fn: () => Promise<T>): Promise<T>
  }

  interface ExecutionContext {
    waitUntil(promise: Promise<unknown>): void
    passThroughOnException?(): void
  }

  class WebSocketPair {
    0: WebSocket
    1: WebSocket
    constructor()
  }

  interface WebSocket {
    accept(): void
  }

  interface ResponseInit {
    webSocket?: WebSocket
  }
}
