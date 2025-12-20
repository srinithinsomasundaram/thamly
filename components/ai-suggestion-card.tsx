"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, Check, X, Sparkles } from "lucide-react"

export interface AISuggestion {
  id: string
  type: "grammar" | "spelling" | "translation" | "tone" | "improvement" | "tamil-spelling" | "news"
  title: string
  original?: string
  suggested: string
  reason?: string
  highlight?: { start: number; end: number }
  position?: number
  _dismiss?: boolean
  _dismissAll?: boolean
  tone?: string
}

interface AISuggestionCardProps {
  suggestion: AISuggestion
  onApply: (suggestion: AISuggestion) => void
  onDismiss: (id: string) => void
}

export function AISuggestionCard({ suggestion, onApply, onDismiss }: AISuggestionCardProps) {
  const [isApplying, setIsApplying] = useState(false)

  const typeStyles: Record<
    string,
    {
      icon: React.ElementType
      label: string
      dot: string
      border: string
      chipBg: string
      chipText: string
      originalBg: string
      originalBorder: string
      suggestedBg: string
      suggestedBorder: string
    }
  > = {
    "spelling": {
      icon: AlertCircle,
      label: "Spelling",
      dot: "bg-amber-500",
      border: "border-amber-200",
      chipBg: "bg-amber-50",
      chipText: "text-amber-700",
      originalBg: "bg-amber-50",
      originalBorder: "border-amber-200",
      suggestedBg: "bg-emerald-50",
      suggestedBorder: "border-emerald-200",
    },
    "tamil-spelling": {
      icon: AlertCircle,
      label: "Spelling",
      dot: "bg-amber-500",
      border: "border-amber-200",
      chipBg: "bg-amber-50",
      chipText: "text-amber-700",
      originalBg: "bg-amber-50",
      originalBorder: "border-amber-200",
      suggestedBg: "bg-emerald-50",
      suggestedBorder: "border-emerald-200",
    },
    "grammar": {
      icon: AlertCircle,
      label: "Grammar",
      dot: "bg-rose-500",
      border: "border-rose-200",
      chipBg: "bg-rose-50",
      chipText: "text-rose-700",
      originalBg: "bg-rose-50",
      originalBorder: "border-rose-200",
      suggestedBg: "bg-emerald-50",
      suggestedBorder: "border-emerald-200",
    },
    "improvement": {
      icon: Sparkles,
      label: "Tone/Style",
      dot: "bg-sky-500",
      border: "border-sky-200",
      chipBg: "bg-sky-50",
      chipText: "text-sky-700",
      originalBg: "bg-sky-50",
      originalBorder: "border-sky-200",
      suggestedBg: "bg-emerald-50",
      suggestedBorder: "border-emerald-200",
    },
    "tone": {
      icon: Sparkles,
      label: "Tone",
      dot: "bg-teal-600",
      border: "border-teal-200",
      chipBg: "bg-teal-50",
      chipText: "text-teal-700",
      originalBg: "bg-teal-50",
      originalBorder: "border-teal-200",
      suggestedBg: "bg-emerald-50",
      suggestedBorder: "border-emerald-200",
    },
    "translation": {
      icon: Sparkles,
      label: "Translation",
      dot: "bg-emerald-500",
      border: "border-emerald-200",
      chipBg: "bg-emerald-50",
      chipText: "text-emerald-700",
      originalBg: "bg-slate-50",
      originalBorder: "border-slate-200",
      suggestedBg: "bg-emerald-50",
      suggestedBorder: "border-emerald-200",
    },
    "news": {
      icon: Sparkles,
      label: "News",
      dot: "bg-red-600",
      border: "border-red-300",
      chipBg: "bg-red-50",
      chipText: "text-red-700",
      originalBg: "bg-red-50",
      originalBorder: "border-red-200",
      suggestedBg: "bg-emerald-50",
      suggestedBorder: "border-emerald-200",
    },
  }

  const theme =
    typeStyles[suggestion.type] ||
    {
      icon: AlertCircle,
      label: suggestion.type,
      dot: "bg-slate-500",
      border: "border-slate-200",
      chipBg: "bg-slate-50",
      chipText: "text-slate-700",
      originalBg: "bg-slate-50",
      originalBorder: "border-slate-200",
      suggestedBg: "bg-emerald-50",
      suggestedBorder: "border-emerald-200",
    }

  const Icon = theme.icon

  const handleApply = () => {
    setIsApplying(true)
    onApply(suggestion)
    // The timeout can be removed if the parent component handles the loading state
    setTimeout(() => setIsApplying(false), 1000)
  }

  const getHighlightedOriginal = () => {
    if (!suggestion.original || !suggestion.highlight) {
      return suggestion.original
    }
    const { start, end } = suggestion.highlight
    return (
      <>
        {suggestion.original.substring(0, start)}
        <span className="bg-teal-50 text-teal-800 px-1 rounded-md border border-teal-200">
          {suggestion.original.substring(start, end)}
        </span>
        {suggestion.original.substring(end)}
      </>
    )
  }

  return (
    <div className={`rounded-2xl border ${theme.border} bg-white shadow-sm`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
        <Icon className={`h-4 w-4 ${theme.chipText}`} />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-900 leading-none">{theme.label}</span>
          <span className="text-xs text-slate-500">{suggestion.title}</span>
        </div>
        <span className={`ml-auto rounded-full px-2 py-1 text-[11px] font-semibold border ${theme.chipBg} ${theme.chipText}`}>
          {suggestion.type === "translation" ? "Translation" : "Correction"}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {suggestion.original && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-600">Original</div>
            <p className={`rounded-lg border ${theme.originalBorder} ${theme.originalBg} px-3 py-2 text-sm font-semibold text-slate-900 leading-relaxed`}>
              {getHighlightedOriginal()}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-600">Suggested</div>
          <p className={`rounded-lg border ${theme.suggestedBorder} ${theme.suggestedBg} px-3 py-2 text-sm font-semibold text-emerald-900 leading-relaxed`}>
            {suggestion.suggested}
          </p>
        </div>

        {suggestion.reason && (
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 border border-slate-200 leading-relaxed">
            <span className="block text-xs font-semibold text-slate-600 mb-1">Reason</span>
            {suggestion.reason}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 rounded-b-2xl">
        <Button
          onClick={handleApply}
          disabled={isApplying}
          className="h-9 px-4 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white"
        >
          <Check className="w-4 h-4 mr-1" />
          {isApplying ? "Applying..." : "Accept"}
        </Button>
        <Button
          onClick={() => onDismiss(suggestion.id)}
          variant="outline"
          className="h-9 px-4 text-xs font-semibold border-slate-300 text-slate-900 bg-white hover:bg-slate-100"
        >
          <X className="w-4 h-4 mr-1" />
          Ignore
        </Button>
      </div>
    </div>
  )
}
