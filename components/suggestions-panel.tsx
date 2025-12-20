"use client"

import { Sparkles, CheckCircle2, AlertCircle } from "lucide-react"

interface Suggestion {
  type: "spelling" | "grammar" | "style" | "clarity"
  original: string
  suggestion: string
  reason: string
}

interface SuggestionsPanelProps {
  suggestions: Suggestion[]
  isLoading: boolean
  onAccept: (index: number) => void
  onIgnore: (index: number) => void
  onAcceptAll: () => void
}

export function SuggestionsPanel({ suggestions, isLoading, onAccept, onIgnore, onAcceptAll }: SuggestionsPanelProps) {
  const getTypeStyles = (type: string) => {
    const styleMap: Record<string, { border: string; bg: string; dotColor: string; label: string; accentBg: string }> =
      {
        spelling: {
          border: "border-l-4 border-yellow-500",
          bg: "bg-yellow-50 dark:bg-yellow-950/30",
          dotColor: "bg-yellow-400",
          label: "Spelling",
          accentBg: "bg-yellow-100 dark:bg-yellow-900/40",
        },
        grammar: {
          border: "border-l-4 border-red-500",
          bg: "bg-red-50 dark:bg-red-950/30",
          dotColor: "bg-red-400",
          label: "Grammar",
          accentBg: "bg-red-100 dark:bg-red-900/40",
        },
        style: {
          border: "border-l-4 border-purple-500",
          bg: "bg-purple-50 dark:bg-purple-950/30",
          dotColor: "bg-purple-400",
          label: "Style",
          accentBg: "bg-purple-100 dark:bg-purple-900/40",
        },
        clarity: {
          border: "border-l-4 border-blue-500",
          bg: "bg-blue-50 dark:bg-blue-950/30",
          dotColor: "bg-blue-400",
          label: "Clarity",
          accentBg: "bg-blue-100 dark:bg-blue-900/40",
        },
      }
    return styleMap[type] || styleMap.style
  }

  return (
    <div className="w-96 border-l border-border bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">AI Assistant</h2>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Analyzing...</p>
          </div>
        </div>
      )}

      {/* No Issues State */}
      {!isLoading && suggestions.length === 0 && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Your writing looks great!</h3>
            <p className="text-xs text-muted-foreground">
              Keep writing. Thamly will tap you when there's something worth fixing.
            </p>
          </div>
        </div>
      )}

      {/* Suggestions List */}
      {!isLoading && suggestions.length > 0 && (
        <>
          {/* Summary */}
          <div className="px-6 py-3 bg-primary/5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""} found
              </span>
            </div>
            {suggestions.length > 0 && (
              <button
                onClick={onAcceptAll}
                className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                Accept All
              </button>
            )}
          </div>

          {/* Suggestions */}
          <div className="flex-1 overflow-auto space-y-3 px-4 py-4">
            {suggestions.map((suggestion, index) => {
              const styles = getTypeStyles(suggestion.type)
              return (
                <div
                  key={index}
                  className={`rounded-lg border-2 border-border ${styles.border} ${styles.bg} p-4 space-y-3 hover:border-primary/50 transition-all`}
                >
                  {/* Type Badge */}
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 ${styles.dotColor} rounded-full`} />
                    <span className="text-sm font-semibold text-foreground">{styles.label}</span>
                  </div>

                  {/* Original */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium">Original:</p>
                    <div
                      className={`${styles.accentBg} border-l-4 border-current px-3 py-2.5 rounded text-sm text-foreground break-words font-tamil leading-relaxed`}
                    >
                      {suggestion.original}
                    </div>
                  </div>

                  {/* Suggestion */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium">Suggested:</p>
                    <div
                      className={`${styles.accentBg} border-l-4 border-green-600 px-3 py-2.5 rounded text-sm text-green-700 dark:text-green-400 break-words font-tamil font-semibold leading-relaxed`}
                    >
                      {suggestion.suggestion}
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium">Reason:</p>
                    <p className="text-xs text-foreground leading-relaxed">{suggestion.reason}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => onAccept(index)}
                      className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
                    >
                      Apply suggestion
                    </button>
                    <button
                      onClick={() => onIgnore(index)}
                      className="flex-1 px-3 py-2 border border-border text-foreground rounded-lg font-semibold text-sm hover:bg-accent/5 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer Warning */}
          <div className="px-4 py-3 border-t border-border bg-card/50 text-xs text-muted-foreground text-center">
            Thamly can make mistakes. Verify before using it.
          </div>
        </>
      )}
    </div>
  )
}
