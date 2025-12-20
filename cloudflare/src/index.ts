type Env = {
  DB: D1Database
  SESSION_SECRET: string
  DRAFT_ROOM: DurableObjectNamespace
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  GOOGLE_REDIRECT_URI?: string
}

type Session = {
  userId: string
  email: string
  full_name?: string | null
}

const SESSION_COOKIE = "session"
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const pathname = url.pathname

    // WebSocket realtime for drafts (Durable Object)
    if (pathname.startsWith("/ws/draft/")) {
      const draftId = pathname.split("/").pop() || ""
      const id = env.DRAFT_ROOM.idFromName(draftId)
      const stub = env.DRAFT_ROOM.get(id)
      return stub.fetch(request)
    }

    // Health endpoints
    if (pathname === "/api/health") {
      return json({ ok: true, env: "cloudflare-worker" })
    }
    if (pathname === "/api/diag/db") {
      try {
        const row = await env.DB.prepare("select datetime('now') as now").first()
        return json({ ok: true, dbTime: row?.now ?? null })
      } catch (err) {
        return json({ ok: false, error: `${err}` }, 500)
      }
    }

    // Auth routes
    if (pathname === "/api/auth/signup" && request.method === "POST") {
      return handleSignup(request, env)
    }
    if (pathname === "/api/auth/login" && request.method === "POST") {
      return handleLogin(request, env)
    }
    if (pathname === "/api/auth/google/start" && request.method === "GET") {
      return handleGoogleStart(request, env)
    }
    if (pathname === "/api/auth/google/callback" && request.method === "GET") {
      return handleGoogleCallback(request, env)
    }
    if (pathname === "/api/auth/logout" && request.method === "POST") {
      return handleLogout()
    }
    if (pathname === "/api/auth/me" && request.method === "GET") {
      const session = await getSession(request, env)
      if (!session) return json({ user: null })
      return json({ user: session })
    }

    // Drafts
    if (pathname === "/api/drafts" && request.method === "GET") {
      return withSession(request, env, async (session) => {
        const res = await env.DB.prepare(
          "select id, title, content, description, status, mode, deleted_at, created_at, updated_at from drafts where user_id = ? and (status != 'deleted' or deleted_at is null) order by updated_at desc",
        )
          .bind(session.userId)
          .all()
        return json({ drafts: res.results || [] })
      })
    }

    if (pathname === "/api/profile" && request.method === "GET") {
      return withSession(request, env, async (session) => {
        const row = await env.DB.prepare(
          "select id, email, full_name, avatar_url, subscription_tier, subscription_status, is_trial_active, trial_ends_at from profiles where id = ?",
        )
          .bind(session.userId)
          .first()
        return json({ profile: row || null })
      })
    }

    if (pathname === "/api/drafts" && request.method === "POST") {
      return withSession(request, env, async (session) => {
        const body = await readJson(request)
        if (!body) return json({ error: "invalid_json" }, 400)
        const title = (body.title as string) || "Untitled Draft"
        const content = (body.content as string) || ""
        const description = (body.description as string) || ""
        const mode = (body.mode as string) || "standard"
        const status = (body.status as string) || "draft"
        const now = new Date().toISOString()
        const id = crypto.randomUUID()
        await env.DB.prepare(
          "insert into drafts (id, user_id, title, content, description, status, mode, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
          .bind(id, session.userId, title, content, description, status, mode, now, now)
          .run()
        return json({ id, title, content, description, status, mode, created_at: now, updated_at: now })
      })
    }

    if (pathname.startsWith("/api/drafts/")) {
      const parts = pathname.split("/")
      const draftId = parts[3]
      if (!draftId) return json({ error: "draft_id_required" }, 400)

      if (request.method === "PUT") {
        return withSession(request, env, async (session) => {
          const body = await readJson(request)
          if (!body) return json({ error: "invalid_json" }, 400)
          const fields: string[] = []
          const values: any[] = []
          const now = new Date().toISOString()

          const allowed: Array<keyof typeof body & string> = ["title", "content", "description", "status", "mode"]
          allowed.forEach((key) => {
            if (body[key] !== undefined) {
              fields.push(`${key} = ?`)
              values.push(body[key])
            }
          })
          fields.push("updated_at = ?")
          values.push(now)

          if (!fields.length) return json({ error: "no_fields" }, 400)

          const sql = `update drafts set ${fields.join(", ")} where id = ? and user_id = ?`
          values.push(draftId, session.userId)
          await env.DB.prepare(sql).bind(...values).run()
          return json({ ok: true, updated_at: now })
        })
      }

      if (request.method === "DELETE") {
        return withSession(request, env, async (session) => {
          const now = new Date().toISOString()
          await env.DB.prepare(
            "update drafts set status = 'deleted', deleted_at = ?, updated_at = ? where id = ? and user_id = ?",
          )
            .bind(now, now, draftId, session.userId)
            .run()
          return json({ ok: true, deleted_at: now })
        })
      }
    }

    return new Response("Not found", { status: 404 })
  },
}

async function handleSignup(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request)
  if (!body) return json({ error: "invalid_json" }, 400)
  const email = (body.email as string | undefined)?.toLowerCase().trim()
  const password = body.password as string | undefined
  const fullName = body.full_name as string | undefined
  if (!email || !password) return json({ error: "email_password_required" }, 400)

  const existing = await env.DB.prepare("select id from users where email = ?").bind(email).first()
  if (existing?.id) return json({ error: "email_taken" }, 400)

  const salt = randomSalt()
  const hashed = await hashPassword(password, salt)
  const userId = crypto.randomUUID()
  const now = new Date().toISOString()

  await env.DB.prepare(
    "insert into users (id, email, full_name, password_hash, created_at, updated_at) values (?, ?, ?, ?, ?, ?)",
  )
    .bind(userId, email, fullName || null, hashed, now, now)
    .run()

  await env.DB.prepare(
    "insert into profiles (id, email, full_name, subscription_tier, subscription_status, created_at, updated_at) values (?, ?, ?, 'free', 'inactive', ?, ?)",
  )
    .bind(userId, email, fullName || null, now, now)
    .run()

  const token = await createSessionToken(userId, email, fullName || null, env.SESSION_SECRET)
  const headers = buildSessionCookies(token)
  return json({ user: { id: userId, email, full_name: fullName || null } }, 200, headers)
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request)
  if (!body) return json({ error: "invalid_json" }, 400)
  const email = (body.email as string | undefined)?.toLowerCase().trim()
  const password = body.password as string | undefined
  if (!email || !password) return json({ error: "email_password_required" }, 400)

  const user = await env.DB.prepare("select id, email, full_name, password_hash from users where email = ?")
    .bind(email)
    .first()
  if (!user?.password_hash) return json({ error: "invalid_credentials" }, 401)

  const valid = await verifyPassword(password, user.password_hash as string)
  if (!valid) return json({ error: "invalid_credentials" }, 401)

  const token = await createSessionToken(user.id as string, user.email as string, (user.full_name as string) || null, env.SESSION_SECRET)
  const headers = buildSessionCookies(token)
  return json({ user: { id: user.id, email: user.email, full_name: user.full_name } }, 200, headers)
}

async function handleGoogleStart(request: Request, env: Env): Promise<Response> {
  const { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI, SESSION_SECRET } = env
  if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
    return json({ error: "google_not_configured" }, 500)
  }
  const url = new URL(request.url)
  const redirect = url.searchParams.get("redirect") || "/"
  const state = await createStateToken({ redirect }, SESSION_SECRET)
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID)
  authUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", "openid email profile")
  authUrl.searchParams.set("state", state)
  authUrl.searchParams.set("prompt", "select_account")
  return Response.redirect(authUrl.toString(), 302)
}

async function handleGoogleCallback(request: Request, env: Env): Promise<Response> {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, SESSION_SECRET } = env
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    return json({ error: "google_not_configured" }, 500)
  }

  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const stateParam = url.searchParams.get("state")
  if (!code || !stateParam) return json({ error: "missing_code_or_state" }, 400)

  const state = await verifyStateToken(stateParam, SESSION_SECRET)
  if (!state) return json({ error: "invalid_state" }, 400)

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  })
  if (!tokenRes.ok) {
    const text = await tokenRes.text()
    return json({ error: "google_token_error", detail: text }, 400)
  }
  const tokenJson = (await tokenRes.json()) as { access_token?: string }
  if (!tokenJson.access_token) return json({ error: "google_token_missing" }, 400)

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  })
  if (!userRes.ok) {
    const text = await userRes.text()
    return json({ error: "google_userinfo_error", detail: text }, 400)
  }
  const profile = (await userRes.json()) as { email?: string; name?: string; picture?: string; id?: string }
  if (!profile.email) return json({ error: "google_email_missing" }, 400)

  const email = profile.email.toLowerCase()
  const fullName = profile.name || null
  const avatar = profile.picture || null
  const now = new Date().toISOString()

  const existing = await env.DB.prepare("select id from users where email = ?").bind(email).first()
  const userId = existing?.id ? (existing.id as string) : crypto.randomUUID()

  if (!existing?.id) {
    await env.DB.prepare(
      "insert into users (id, email, full_name, avatar_url, provider, created_at, updated_at) values (?, ?, ?, ?, 'google', ?, ?)",
    )
      .bind(userId, email, fullName, avatar, now, now)
      .run()
  } else {
    await env.DB.prepare("update users set full_name = ?, avatar_url = ?, updated_at = ? where id = ?")
      .bind(fullName, avatar, now, userId)
      .run()
  }

  await env.DB.prepare(
    "insert or ignore into profiles (id, email, full_name, avatar_url, subscription_tier, subscription_status, created_at, updated_at) values (?, ?, ?, ?, 'free', 'inactive', ?, ?)",
  )
    .bind(userId, email, fullName, avatar, now, now)
    .run()

  await env.DB.prepare("update profiles set email = ?, full_name = coalesce(full_name, ?), avatar_url = coalesce(avatar_url, ?) where id = ?")
    .bind(email, fullName, avatar, userId)
    .run()

  const token = await createSessionToken(userId, email, fullName, SESSION_SECRET)
  const headers = buildSessionCookies(token)
  const redirectTo = state.redirect || "/"
  headers.set("Location", redirectTo)
  return new Response(null, { status: 302, headers })
}

function handleLogout(): Response {
  const headers = new Headers()
  headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`)
  return json({ ok: true }, 200, headers)
}

async function withSession(
  request: Request,
  env: Env,
  handler: (session: Session) => Promise<Response>,
): Promise<Response> {
  const session = await getSession(request, env)
  if (!session) return json({ error: "unauthorized" }, 401)
  return handler(session)
}

async function getSession(request: Request, env: Env): Promise<Session | null> {
  const token = getCookie(request.headers.get("Cookie"), SESSION_COOKIE)
  if (!token) return null
  const payload = await verifySessionToken(token, env.SESSION_SECRET)
  if (!payload) return null
  // Ensure user still exists
  const user = await env.DB.prepare("select id, email, full_name from users where id = ?").bind(payload.userId).first()
  if (!user) return null
  return { userId: user.id as string, email: user.email as string, full_name: (user.full_name as string) || null }
}

async function readJson(request: Request): Promise<any | null> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

function json(data: any, status = 200, headers?: HeadersInit): Response {
  const base = new Headers(headers || {})
  if (!base.has("Content-Type")) base.set("Content-Type", "application/json")
  return new Response(JSON.stringify(data), { status, headers: base })
}

function getCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null
  const cookies = cookieHeader.split(";").map((c) => c.trim())
  for (const c of cookies) {
    const [k, ...rest] = c.split("=")
    if (k === name) return rest.join("=")
  }
  return null
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest("SHA-256", data)
  const hash = bufferToBase64(new Uint8Array(digest))
  return `${salt}:${hash}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  const candidate = await hashPassword(password, salt)
  return timingSafeEqual(candidate, stored)
}

function randomSalt(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return bufferToBase64(bytes)
}

function bufferToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return out === 0
}

async function createSessionToken(userId: string, email: string, fullName: string | null, secret: string): Promise<string> {
  const expires = Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  const payload = JSON.stringify({ userId, email, full_name: fullName, exp: expires })
  const sig = await hmacSign(payload, secret)
  return `${base64UrlEncode(payload)}.${sig}`
}

async function verifySessionToken(token: string, secret: string): Promise<{ userId: string; email: string; full_name: string | null } | null> {
  const [b64, sig] = token.split(".")
  if (!b64 || !sig) return null
  const payloadJson = base64UrlDecode(b64)
  if (!payloadJson) return null
  const expectedSig = await hmacSign(payloadJson, secret)
  if (!timingSafeEqual(sig, expectedSig)) return null
  try {
    const payload = JSON.parse(payloadJson) as { userId: string; email: string; full_name: string | null; exp: number }
    if (!payload.exp || Date.now() > payload.exp) return null
    return { userId: payload.userId, email: payload.email, full_name: payload.full_name }
  } catch {
    return null
  }
}

async function hmacSign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message))
  return base64UrlEncode(sig)
}

function base64UrlEncode(data: ArrayBuffer | string): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data)
  let binary = ""
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64UrlDecode(str: string): string | null {
  try {
    const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4))
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + pad
    return atob(b64)
  } catch {
    return null
  }
}

function buildSessionCookies(token: string): Headers {
  const headers = new Headers()
  headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  )
  return headers
}

async function createStateToken(payload: Record<string, any>, secret: string): Promise<string> {
  const exp = Date.now() + 10 * 60 * 1000
  const data = JSON.stringify({ ...payload, exp })
  const sig = await hmacSign(data, secret)
  return `${base64UrlEncode(data)}.${sig}`
}

async function verifyStateToken(token: string, secret: string): Promise<{ redirect?: string } | null> {
  const [b64, sig] = token.split(".")
  if (!b64 || !sig) return null
  const payloadJson = base64UrlDecode(b64)
  if (!payloadJson) return null
  const expected = await hmacSign(payloadJson, secret)
  if (!timingSafeEqual(sig, expected)) return null
  try {
    const parsed = JSON.parse(payloadJson) as { redirect?: string; exp?: number }
    if (parsed.exp && Date.now() > parsed.exp) return null
    return { redirect: parsed.redirect }
  } catch {
    return null
  }
}

export class DraftRoom {
  state: DurableObjectState
  sessions: Map<WebSocket, string>

  constructor(state: DurableObjectState) {
    this.state = state
    this.sessions = new Map()
    this.state.blockConcurrencyWhile(async () => {})
  }

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get("Upgrade")
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 })
    }

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket]
    this.handleSession(server)
    return new Response(null, { status: 101, webSocket: client })
  }

  handleSession(socket: WebSocket) {
    socket.accept()
    const sessionId = crypto.randomUUID()
    this.sessions.set(socket, sessionId)

    socket.addEventListener("message", (event) => {
      try {
        const msg = typeof event.data === "string" ? event.data : ""
        const parsed = JSON.parse(msg || "{}")
        const payload = JSON.stringify({ ...parsed, sender: sessionId })
        this.broadcast(payload, socket)
      } catch (err) {
        console.error("Failed to handle message", err)
      }
    })

    const close = () => {
      this.sessions.delete(socket)
      try {
        socket.close()
      } catch {
        // ignore
      }
    }

    socket.addEventListener("close", close)
    socket.addEventListener("error", close)
  }

  broadcast(message: string, except?: WebSocket) {
    this.sessions.forEach((_, socket) => {
      if (socket === except) return
      try {
        socket.send(message)
      } catch {
        // drop broken sockets
        this.sessions.delete(socket)
      }
    })
  }
}
