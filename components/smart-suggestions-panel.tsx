"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lightbulb, CheckCircle2, AlertCircle } from "lucide-react"

interface Suggestion {
  id: string
  type: "improvement" | "grammar" | "style" | "performance"
  message: string
  severity: "low" | "medium" | "high"
}

interface SmartSuggestionsPanelProps {
  suggestions: Suggestion[]
  onApply?: (suggestionId: string) => void
  onDismiss?: (suggestionId: string) => void
}

export function SmartSuggestionsPanel({ suggestions, onApply, onDismiss }: SmartSuggestionsPanelProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "border-red-200 bg-red-50 dark:bg-red-950/20"
      case "medium":
        return "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20"
      default:
        return "border-blue-200 bg-blue-50 dark:bg-blue-950/20"
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "improvement":
        return <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      case "grammar":
        return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
      case "style":
        return <Lightbulb className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
    }
  }

  if (suggestions.length === 0) {
    return (
      <Card className="p-4 border-green-200 bg-green-50 dark:bg-green-950/20">
        <div className="flex items-center gap-2 text-sm text-green-900 dark:text-green-200">
          <CheckCircle2 className="h-4 w-4" />
          <span>Perfect! No suggestions at the moment.</span>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {suggestions.map((suggestion) => (
        <Card
          key={suggestion.id}
          className={`p-3 border transition-all duration-200 animate-in slide-in-from-right ${getSeverityColor(
            suggestion.severity,
          )}`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{getIcon(suggestion.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{suggestion.message}</p>
            </div>
            <div className="flex gap-2 ml-2">
              {onApply && (
                <Button size="sm" variant="ghost" onClick={() => onApply(suggestion.id)} className="h-7 px-2 text-xs">
                  Apply
                </Button>
              )}
              {onDismiss && (
                <Button size="sm" variant="ghost" onClick={() => onDismiss(suggestion.id)} className="h-7 px-2 text-xs">
                  Dismiss
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
