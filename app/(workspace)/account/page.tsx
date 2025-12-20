import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AccountPageContent } from "@/components/workspace/account-content"

async function fetchProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { user: null, profile: null }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  return { user, profile }
}

export default async function AccountPage() {
  const { user, profile } = await fetchProfile()
  if (!user) {
    redirect("/auth/login")
  }
  return <AccountPageContent user={user} profile={profile} />
}
