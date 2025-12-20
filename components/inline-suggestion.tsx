"use client"

import { X } from "lucide-react"

interface InlineSuggestionProps {
  type: "spelling" | "grammar" | "style" | "clarity"
  original: string
  suggestion: string
  reason: string
  position: { x: number; y: number }
  onAccept: () => void
  onDismiss: () => void
}

export function InlineSuggestion({
  type,
  original,
  suggestion,
  reason,
  position,
  onAccept,
  onDismiss,
}: InlineSuggestionProps) {
  const typeStyles: Record<string, { border: string; bg: string; dot: string }> = {
    spelling: { border: "border-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950", dot: "bg-yellow-500" },
    grammar: { border: "border-red-500", bg: "bg-red-50 dark:bg-red-950", dot: "bg-red-500" },
    clarity: { border: "border-blue-500", bg: "bg-blue-50 dark:bg-blue-950", dot: "bg-blue-500" },
    style: { border: "border-purple-500", bg: "bg-purple-50 dark:bg-purple-950", dot: "bg-purple-500" },
  }

  const style = typeStyles[type]

  return (
    <div
      className={`fixed z-50 w-96 border-2 ${style.border} ${style.bg} rounded-lg shadow-xl p-4 backdrop-blur-sm`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translateY(-100%)",
      }}
    >
      {/* Type Label */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 ${style.dot} rounded-full`} />
          <span className="text-xs font-bold text-foreground capitalize">{type}</span>
        </div>
        <button onClick={onDismiss} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Original Text Highlight */}
      <div className="mb-3 p-2 bg-white/50 dark:bg-black/20 rounded text-sm text-foreground">
        <span className="text-xs text-muted-foreground block mb-1">Original:</span>
        <span className="line-through">{original}</span>
      </div>

      {/* Suggestion */}
      <div className="mb-3 p-2 bg-white/50 dark:bg-black/20 rounded text-sm text-foreground">
        <span className="text-xs text-muted-foreground block mb-1">Suggested:</span>
        <span className="font-semibold text-green-700 dark:text-green-400">{suggestion}</span>
      </div>

      {/* Reason */}
      <p className="text-xs text-foreground mb-3 leading-relaxed">{reason}</p>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded font-semibold text-xs hover:opacity-90 transition-opacity"
        >
          Apply suggestion
        </button>
        <button
          onClick={onDismiss}
          className="flex-1 px-3 py-2 border border-foreground/20 text-foreground rounded font-semibold text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
