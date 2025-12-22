"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
      router.push("/")
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#0f2c21]">Delete account?</DialogTitle>
            <DialogDescription className="text-[#42584a]">
              This will permanently remove your data. Please confirm you understand:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-[#0f2c21]">
            <p>What happens:</p>
            <ul className="list-disc space-y-1 pl-5 text-[#42584a]">
              <li>Drafts, trash, usage logs, and profile are deleted and cannot be restored.</li>
              <li>Active subscriptions are cancelled; refunds are not automatic.</li>
              <li>If you believe you qualify for a refund (e.g., within 3 days of purchase), contact support after deletion.</li>
            </ul>
            <p className="text-red-700 font-semibold">This action cannot be undone.</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="border-[#dfe9dd] text-[#0f2c21]"
            >
              Keep my account
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Deleting..." : "Delete permanently"}
            </Button>
          </DialogFooter>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </DialogContent>
      </Dialog>
    </>
  )
}
