import { CollabJoinClient } from "@/components/collab/collab-join-client"
import { verifyCollaborationToken } from "@/lib/collaboration/tokens"
import { createClient } from "@/lib/supabase/server"

interface JoinPageProps {
  searchParams: { token?: string }
}

export default async function CollabJoinPage({ searchParams }: JoinPageProps) {
  const token = typeof searchParams?.token === "string" ? searchParams.token : ""

  let verification = { valid: false, reason: "Missing token" as string, payload: undefined as any }
  try {
    const raw = token
      ? verifyCollaborationToken(token)
      : { valid: false, reason: "Missing token", payload: undefined as any }

    verification = {
      valid: raw.valid,
      payload: raw.payload,
      reason: raw.reason ?? (raw.valid ? "OK" : "Unknown reason"),
    }
  } catch (err) {
    verification = { valid: false, reason: "Invalid token", payload: undefined as any }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <CollabJoinClient
      token={token}
      inviteEmail={verification.payload?.email || ""}
      draftId={verification.payload?.draft_id || ""}
      hasSession={!!user}
      sessionEmail={user?.email || ""}
      valid={verification.valid}
      reason={verification.reason}
    />
  )
}
