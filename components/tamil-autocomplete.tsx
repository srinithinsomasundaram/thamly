"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { TransliterationSuggestion } from "@/lib/tamil-transliterator"

interface TamilAutocompleteProps {
  suggestions: TransliterationSuggestion[]
  position: { top: number; left: number } | null
  selectedIndex: number
  onSelect: (suggestion: TransliterationSuggestion) => void
  onClose: () => void
  isLoading?: boolean
  isAIEnhanced?: boolean
}

export function TamilAutocomplete({
  suggestions,
  position,
  selectedIndex,
  onSelect,
  onClose,
  isLoading = false,
  isAIEnhanced = false,
}: TamilAutocompleteProps) {
  if (!position || (suggestions.length === 0 && !isLoading)) {
    return null
  }

  return (
    <div
      className="fixed z-50 bg-card border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        minWidth: "320px",
      }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-6 px-4">
          <div className="h-4 w-4 rounded-full border-2 border-muted border-t-primary animate-spin mr-3" />
          <span className="text-sm text-muted-foreground">Getting suggestions...</span>
        </div>
      ) : suggestions.length > 0 ? (
        <>
          <div className="py-1 max-h-80 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.romanized}-${index}`}
                onClick={() => onSelect(suggestion)}
                className={cn(
                  "w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors duration-150 border-l-2",
                  index === selectedIndex
                    ? "bg-primary/10 border-l-primary text-primary"
                    : "border-l-transparent hover:border-l-primary/30",
                )}
              >
                <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/20 text-primary text-xs font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-tamil text-lg font-semibold text-foreground truncate">{suggestion.tamil}</div>
                  <div className="text-xs text-muted-foreground">{suggestion.romanized}</div>
                </div>
                {suggestion.confidence && suggestion.confidence < 1 && (
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    {Math.round(suggestion.confidence * 100)}%
                  </Badge>
                )}
              </button>
            ))}
          </div>
          <div className="px-4 py-2 bg-muted/50 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs font-semibold shadow-sm mx-1">
                1-4
              </kbd>
              or{" "}
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs font-semibold shadow-sm mx-1">
                Space
              </kbd>
            </p>
            {isAIEnhanced && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                AI Enhanced
              </span>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
