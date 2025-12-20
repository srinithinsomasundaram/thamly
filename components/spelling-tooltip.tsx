"use client"

import { Button } from "@/components/ui/button"
import { X, Check } from "lucide-react"

interface SpellingTooltipProps {
  word: string
  suggestions: string[]
  explanation: string
  position: { top: number; left: number }
  onApply: (suggestion: string) => void
  onIgnore: () => void
}

export function SpellingTooltip({ word, suggestions, explanation, position, onApply, onIgnore }: SpellingTooltipProps) {
  return (
    <div
      className="fixed z-50 bg-card border border-border rounded-lg shadow-lg p-3 max-w-xs"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-sm text-foreground">Spelling Issue</p>
          <p className="text-sm text-muted-foreground mt-1">{explanation}</p>
        </div>
        <Button
          onClick={onIgnore}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Suggestions:</p>
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              onClick={() => onApply(suggestion)}
              variant="secondary"
              size="sm"
              className="w-full justify-start text-sm"
            >
              <Check className="h-3 w-3 mr-2" />
              {suggestion}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
