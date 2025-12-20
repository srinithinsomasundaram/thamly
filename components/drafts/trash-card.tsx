"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { FileText, Clock, Trash2, RotateCcw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Draft {
  id: string
  title: string
  status: string
  updated_at: string
  content: string
  deleted_at: string | null
}

interface TrashCardProps {
  draft: Draft
  onUpdate: () => void
}

export function TrashCard({ draft, onUpdate }: TrashCardProps) {
  const [restoring, setRestoring] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [action, setAction] = useState<"restore" | "delete" | null>(null)

  const handleRestore = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setAction("restore")
    setShowConfirmDialog(true)
  }

  const handlePermanentlyDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setAction("delete")
    setShowConfirmDialog(true)
  }

  const confirmAction = async () => {
    const supabase = createClient()

    if (action === "restore") {
      setRestoring(true)
      try {
        const { data, error } = await (supabase as any)
          .from("drafts")
          .update({
            status: "draft",
            deleted_at: null,
          })
          .eq("id", draft.id)
          .select()

        if (error) {
          console.error("Failed to restore draft:", error)
          console.error("Error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
        } else if (data && data.length > 0) {
          console.log("Draft successfully restored:", data[0])
          onUpdate()
          setShowConfirmDialog(false)
        } else {
          console.error("No data returned from restore operation - check permissions")
        }
      } catch (error) {
        console.error("Error restoring draft:", error)
      } finally {
        setRestoring(false)
      }
    } else if (action === "delete") {
      setDeleting(true)
      try {
        const { data, error } = await (supabase as any)
          .from("drafts")
          .delete()
          .eq("id", draft.id)
          .select()

        if (error) {
          console.error("Failed to permanently delete draft:", error)
          console.error("Error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
        } else if (data && data.length > 0) {
          console.log("Draft permanently deleted:", data[0])
          onUpdate()
          setShowConfirmDialog(false)
        } else {
          console.error("No data returned from delete operation - check permissions")
        }
      } catch (error) {
        console.error("Error permanently deleting draft:", error)
      } finally {
        setDeleting(false)
      }
    }
  }

  // Get first few lines of content for preview
  const getContentPreview = (content: string) => {
    if (!content || content.trim() === '') {
      return "No content"
    }

    // Remove extra whitespace and get first 150 characters
    const cleanContent = content.replace(/\s+/g, ' ').trim()
    const preview = cleanContent.substring(0, 150)

    return preview.length < cleanContent.length ? `${preview}...` : preview
  }

  return (
    <>
      <div className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Card content */}
        <div className="relative p-6 h-56 flex flex-col">
          {/* Top section with icon and action buttons */}
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
              <FileText className="h-6 w-6 text-red-700" />
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="destructive"
                className="capitalize text-xs font-medium px-2.5 py-1"
              >
                Deleted
              </Badge>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors duration-300">
            {draft.title || "Untitled Draft"}
          </h3>

          {/* Description/Content Preview */}
          <p className="text-sm text-gray-600 line-clamp-3 mb-auto">
            {getContentPreview(draft.content)}
          </p>

          {/* Bottom section with date and action buttons */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1.5" />
              <span>
                {draft.deleted_at
                  ? new Date(draft.deleted_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })
                  : "No date"
                }
              </span>
            </div>
          </div>

          {/* Action buttons - Always visible */}
          <div className="absolute bottom-4 right-4 flex gap-2 opacity-100 transition-all duration-200">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-teal-600 hover:text-teal-700 hover:bg-teal-50 border-teal-200 text-xs"
              onClick={handleRestore}
              disabled={restoring}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Restore
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
              onClick={handlePermanentlyDelete}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Permanently delete</span>
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title={action === "restore" ? "Restore Draft" : "Permanently Delete Draft"}
        description={
          action === "restore"
            ? `Are you sure you want to restore "${draft.title || 'Untitled Draft'}" to your drafts?`
            : `Are you sure you want to permanently delete "${draft.title || 'Untitled Draft'}"? This action cannot be undone.`
        }
        confirmText={action === "restore" ? "Restore" : "Delete Permanently"}
        cancelText="Cancel"
        onConfirm={confirmAction}
        loading={restoring || deleting}
      />
    </>
  )
}
