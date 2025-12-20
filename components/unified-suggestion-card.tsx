"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, X, Sparkles } from "lucide-react"
import { type AISuggestion } from "./ai-suggestion-card"

interface UnifiedSuggestionCardProps {
  suggestions: AISuggestion[]
  onApplyAll: () => void
  onApplySuggestion: (suggestion: AISuggestion) => void
  onDismiss: (id: string) => void
  onDismissAll: () => void
}

export function UnifiedSuggestionCard({
  suggestions,
  onApplyAll,
  onApplySuggestion,
  onDismiss,
  onDismissAll
}: UnifiedSuggestionCardProps) {
  const [applyingIds, setApplyingIds] = useState<Set<string>>(new Set())

  const typeStyles: Record<string, { dot: string; label: string; accent: string; bg: string }> = {
    "spelling": { dot: "bg-amber-500", label: "Spelling", accent: "border-amber-300", bg: "bg-amber-50" },
    "tamil-spelling": { dot: "bg-amber-500", label: "Spelling", accent: "border-amber-300", bg: "bg-amber-50" },
    "grammar": { dot: "bg-red-500", label: "Grammar", accent: "border-red-300", bg: "bg-red-50" },
    "improvement": { dot: "bg-blue-500", label: "Improvement", accent: "border-blue-300", bg: "bg-blue-50" },
    "translation": { dot: "bg-emerald-500", label: "Translation", accent: "border-emerald-300", bg: "bg-emerald-50" },
    "tone": { dot: "bg-purple-500", label: "Tone", accent: "border-purple-300", bg: "bg-purple-50" },
  }

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    setApplyingIds(prev => new Set(Array.from(prev).concat([suggestion.id])))
    onApplySuggestion(suggestion)
    setTimeout(() => {
      setApplyingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(suggestion.id)
        return newSet
      })
    }, 1000)
  }

  const handleApplyAll = () => {
    suggestions.forEach(s => setApplyingIds(prev => new Set(Array.from(prev).concat([s.id]))))
    onApplyAll()
    setTimeout(() => setApplyingIds(new Set()), 1500)
  }

  if (suggestions.length === 0) return null

  return (
    <div className="rounded-2xl border-2 border-emerald-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <div className="text-base font-semibold text-emerald-900">
            AI Suggestions ({suggestions.length})
          </div>
          <div className="flex gap-1">
            {Array.from(new Set(suggestions.map(s => s.type))).map(type => {
              const theme = typeStyles[type] || typeStyles["improvement"]
              return (
                <span key={type} className={`h-2 w-2 rounded-full ${theme.dot}`} title={theme.label} />
              )
            })}
          </div>
        </div>
        <button
          onClick={onDismissAll}
          className="text-emerald-600 hover:text-emerald-800 p-1 rounded-md hover:bg-emerald-100"
          title="Dismiss all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Suggestions List */}
      <div className="divide-y divide-slate-100">
        {suggestions.map((suggestion) => {
          const theme = typeStyles[suggestion.type] || typeStyles["improvement"]
          const isApplying = applyingIds.has(suggestion.id)

          return (
            <div key={suggestion.id} className="p-4 space-y-3 hover:bg-slate-50 transition-colors">
              {/* Suggestion Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${theme.dot}`}></span>
                  <span className="text-sm font-semibold text-slate-900">{theme.label}</span>
                </div>
                <button
                  onClick={() => onDismiss(suggestion.id)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100"
                  title="Dismiss"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-3 text-sm">
                {suggestion.original && (
                  <>
                    <div className="text-xs font-semibold text-slate-500">Original:</div>
                    <div className={`rounded-md border-l-4 border-l-red-400/80 ${theme.bg} px-3 py-2 text-slate-900`}>
                      {suggestion.original}
                    </div>
                  </>
                )}

                <div className="text-xs font-semibold text-slate-500">
                  {suggestion.original ? "Suggested:" : "Suggestion:"}
                </div>
                <div className={`rounded-md border-l-4 border-l-emerald-400/80 bg-emerald-50 px-3 py-2 text-emerald-900 font-medium`}>
                  {suggestion.suggested}
                </div>

                {suggestion.reason && (
                  <div className="text-xs text-slate-600 italic">
                    💡 {suggestion.reason}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleApplySuggestion(suggestion)}
                  disabled={isApplying}
                  size="sm"
                  className="flex-1 h-7 px-3 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isApplying ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Applied
                    </>
                  ) : (
                    "Accept"
                  )}
                </Button>
                <Button
                  onClick={() => onDismiss(suggestion.id)}
                  disabled={isApplying}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 px-3 text-xs font-medium border-slate-200 hover:bg-slate-100 hover:text-slate-900 text-slate-600"
                >
                  Ignore
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer with Apply All */}
      {suggestions.length > 1 && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
          <Button
            onClick={handleApplyAll}
            disabled={applyingIds.size > 0}
            className="w-full h-9 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white"
          >
            {applyingIds.size === suggestions.length ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                All Applied
              </>
            ) : applyingIds.size > 0 ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept All ({suggestions.length})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}