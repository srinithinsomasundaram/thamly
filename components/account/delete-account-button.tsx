"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export function DeleteAccountButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/account/delete", { method: "POST" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to delete account")
      }
      router.push("/auth/login")
    } catch (err: any) {
      setError(err.message || "Failed to delete account")
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setOpen(true)}
        disabled={loading}
      >
        Delete account
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete account"
        description="Are you sure you want to delete your account? This removes your drafts and profile. This action cannot be undone."
        confirmText={loading ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
        loading={loading}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </>
  )
}
