import crypto from "crypto"

export interface CollaborationTokenPayload {
  draft_id: string
  email: string
  exp: number
}

function base64UrlEncode(input: string | Uint8Array | Buffer) {
  const buffer = typeof input === "string" ? Buffer.from(input, "utf8") : Buffer.isBuffer(input) ? input : Buffer.from(input)
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
  return Buffer.from(padded, "base64").toString("utf8")
}

function getSecret() {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret) {
    throw new Error("Missing SUPABASE_JWT_SECRET for collaboration tokens")
  }
  return secret
}

export function signCollaborationToken(payload: Omit<CollaborationTokenPayload, "exp">, expiresInHours = 48) {
  const header = { alg: "HS256", typ: "JWT" }
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 60 * 60
  const fullPayload: CollaborationTokenPayload = { ...payload, exp }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload))
  const secret = getSecret()

  const data = `${encodedHeader}.${encodedPayload}`
  const signature = base64UrlEncode(crypto.createHmac("sha256", secret).update(data).digest())

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export function verifyCollaborationToken(token: string): { valid: boolean; payload?: CollaborationTokenPayload; reason?: string } {
  try {
    const [header, payload, signature] = token.split(".")
    if (!header || !payload || !signature) {
      return { valid: false, reason: "Malformed token" }
    }

    const data = `${header}.${payload}`
    const secret = getSecret()
    const expectedSig = base64UrlEncode(crypto.createHmac("sha256", secret).update(data).digest())
    if (expectedSig !== signature) {
      return { valid: false, reason: "Invalid signature" }
    }

    const parsedPayload = JSON.parse(base64UrlDecode(payload)) as CollaborationTokenPayload
    if (!parsedPayload?.draft_id || !parsedPayload?.email || !parsedPayload?.exp) {
      return { valid: false, reason: "Missing payload claims" }
    }

    const now = Math.floor(Date.now() / 1000)
    if (parsedPayload.exp < now) {
      return { valid: false, reason: "Expired" }
    }

    return { valid: true, payload: parsedPayload }
  } catch (err) {
    console.error("[CollaborationToken] verify failed", err)
    return { valid: false, reason: "Token verification failed" }
  }
}
