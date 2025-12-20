"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { FileText, Clock, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface Draft {
  id: string
  title: string
  status: string
  updated_at: string
  content: string
}

interface DraftCardProps {
  draft: Draft
  onUpdate: () => void
}

export function DraftCard({ draft, onUpdate }: DraftCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [deleting, setDeleting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowConfirmDialog(true)
  }

  const confirmDelete = async () => {
    setDeleting(true)
    const supabase = createClient()

    try {
      // Ensure the user is authenticated before attempting delete
      const { data: auth } = await supabase.auth.getUser()
      const userId = auth?.user?.id
      if (!userId) {
        toast({
          title: "Session expired",
          description: "Please sign in again to delete drafts.",
          variant: "destructive",
        })
        router.push("/auth/login")
        return
      }

      const { data, error } = await (supabase as any)
        .from("drafts")
        .update({
          status: "deleted",
        })
        .eq("id", draft.id)
        .eq("user_id", userId)
        .select()

      if (error) {
        const message =
          typeof error === "string"
            ? error
            : (error as any)?.message ||
              (error as any)?.details ||
              (error as any)?.hint ||
              "Unable to delete draft."
        const missingDeletedAt =
          message.toLowerCase().includes("deleted_at") ||
          message.toLowerCase().includes("schema cache")

        if (missingDeletedAt) {
          // Fall back to hard delete when soft-delete column is missing
          const { error: hardDeleteError } = await (supabase as any)
            .from("drafts")
            .delete()
            .eq("id", draft.id)
            .eq("user_id", userId)
          if (hardDeleteError) {
            const hardMessage =
              (hardDeleteError as any)?.message ||
              (hardDeleteError as any)?.details ||
              "Unable to delete draft."
            toast({
              title: "Delete failed",
              description: hardMessage,
              variant: "destructive",
            })
            return
          }
          onUpdate()
          setShowConfirmDialog(false)
          toast({
            title: "Deleted",
            description: `"${draft.title || "Untitled Draft"}" was deleted.`,
          })
          return
        }

        toast({
          title: "Delete failed",
          description: message,
          variant: "destructive",
        })
        return
      }

      if (!data || data.length === 0) {
        console.error("No data returned from update operation - check permissions")
        toast({
          title: "Delete failed",
          description: "No response from server. You might not have permission to delete this draft.",
          variant: "destructive",
        })
        return
      }

      onUpdate()
      setShowConfirmDialog(false)
      toast({
        title: "Moved to trash",
        description: `"${draft.title || "Untitled Draft"}" was moved to Trash.`,
      })
    } catch (error: any) {
      console.error("Error deleting draft:", error)
      toast({
        title: "Delete failed",
        description: error?.message || "Something went wrong while deleting this draft.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  // Get first few lines of content for preview
  const getContentPreview = (content: string) => {
    if (!content || content.trim() === '') {
      return "No content yet"
    }

    // Remove extra whitespace and get first 150 characters
    const cleanContent = content.replace(/\s+/g, ' ').trim()
    const preview = cleanContent.substring(0, 150)

    return preview.length < cleanContent.length ? `${preview}...` : preview
  }

  return (
    <>
      <Link href={`/editor?id=${draft.id}`} className="block">
        <div className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer">
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Card content */}
          <div className="relative p-6 h-56 flex flex-col">
            {/* Top section with icon, badge, and delete button */}
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                <FileText className="h-6 w-6 text-teal-700" />
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={draft.status === "published" ? "default" : "secondary"}
                  className="capitalize text-xs font-medium px-2.5 py-1"
                >
                  {draft.status || "draft"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete draft</span>
                </Button>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-teal-600 transition-colors duration-300">
              {draft.title || "Untitled Draft"}
            </h3>

            {/* Description/Content Preview */}
            <p className="text-sm text-gray-600 line-clamp-3 mb-auto">
              {getContentPreview(draft.content)}
            </p>

            {/* Bottom section with date */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1.5" />
                <span>
                  {draft.updated_at
                    ? new Date(draft.updated_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })
                    : "No date"
                  }
                </span>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-300">
                <svg className="h-5 w-5 text-gray-400 group-hover:text-teal-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Delete Draft"
        description={`Are you sure you want to delete "${draft.title || 'Untitled Draft'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </>
  )
}
