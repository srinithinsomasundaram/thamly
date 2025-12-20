"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function NewDraftButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: session } = await supabase.auth.getUser()
    if (!session.user) {
      router.push("/auth/login")
      return
    }

    const { data, error } = await (supabase.from("drafts") as any)
      .insert({
        user_id: session.user.id,
        title: "Untitled Draft",
        status: "draft",
      })
      .select()
      .single()

    setLoading(false)

    if (error) {
      console.error("Failed to create draft:", error)
      return
    }

    // Navigate to the editor with the new draft ID
    if (data?.id) {
      router.push(`/editor?id=${data.id}`)
    }
  }

  return (
    <Button
      onClick={handleCreate}
      className="bg-teal-700 hover:bg-teal-800 text-white"
      disabled={loading || isPending}
    >
      {loading || isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Creating...
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" />
          New draft
        </>
      )}
    </Button>
  )
}
