"use client"

import { useState, useEffect } from "react"
import { Sparkles, X, Loader2, AlertCircle } from "lucide-react"
import { AISuggestionCard, type AISuggestion } from "@/components/ai-suggestion-card"
import { SequentialSuggestionCard } from "@/components/sequential-suggestion-card"
import { TypingStopDetector } from "@/components/editor/typing-stop-detector"

interface AIAssistantPanelProps {
  text: string
  selectedText?: string
  onApplySuggestion?: (suggestion: AISuggestion) => void
  onDeselectSelection?: () => void
  user?: any
  autoSuggestions?: AISuggestion[]
  onNewsMode?: () => void
  appliedChanges: Set<string> // Track applied changes to prevent duplicates
}

export function AIAssistantPanelFinal({
  text,
  selectedText,
  onApplySuggestion,
  onDeselectSelection,
  user,
  autoSuggestions = [],
  onNewsMode,
  appliedChanges
}: AIAssistantPanelProps) {
  const [sequentialSuggestions, setSequentialSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [currentAnalyzedText, setCurrentAnalyzedText] = useState<string>("")

  // Handle typing stop detection
  const handleStopTyping = async (textToAnalyze: string) => {
    // Skip if already analyzed this text
    if (textToAnalyze === currentAnalyzedText) return

    setCurrentAnalyzedText(textToAnalyze)
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/ai/ordered", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToAnalyze }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        setError(errorData.error || "Analysis failed")
        return
      }

      const data = await res.json()

      // Filter out suggestions that have already been applied
      const filteredSuggestions = data.suggestions?.filter((s: any) => {
        // Create unique key for this suggestion
        const key = `${s.type}-${s.tamil.substring(0, 20)}`
        return !appliedChanges.has(key)
      }) || []

      setSequentialSuggestions(filteredSuggestions)
    } catch (err) {
      console.error("Sequential analysis failed:", err)
      setError("Couldn't analyze text. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleApplySequential = (tamilText: string, type: 'translation' | 'spelling' | 'grammar') => {
    // Create a unique key to prevent duplicates
    const key = `${type}-${tamilText.substring(0, 20)}`

    const suggestion: AISuggestion = {
      id: `sequential-${Date.now()}-${type}`,
      type: type,
      title: type === 'translation' ? 'மொழிபெயர்ப்பு' : type === 'grammar' ? 'இலக்கணம்' : 'சொல்லியல்',
      original: currentAnalyzedText,
      suggested: tamilText,
      reason: `Applied ${type} correction automatically`
    }

    // Mark this change as applied
    appliedChanges.add(key)

    onApplySuggestion?.(suggestion)

    // Remove this suggestion from the list
    setSequentialSuggestions(prev => prev.filter(s => s.type !== type || s.tamil !== tamilText))
  }

  const handleDismissSequential = () => {
    setSequentialSuggestions([])
    setError("")
  }

  return (
    <div className="w-full h-full flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm sticky top-4">
      <div className="border-b-4 border-emerald-500 bg-emerald-50 px-4 py-3 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-700" />
            <p className="text-sm font-semibold text-emerald-900">AI Assistant</p>
            {loading && (
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-3">
            {onNewsMode && (
              <button
                onClick={onNewsMode}
                className="px-3 py-1 text-xs font-medium transition-all duration-300 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700 shadow-md hover:shadow-lg hover:scale-105 animate-pulse-subtle"
                title="Convert to professional Tamil news report"
              >
                📰 News Mode
              </button>
          )}
            <div className="text-xs font-semibold text-emerald-800">
              Auto-detecting...
            </div>
          </div>
        </div>
        {selectedText && (
          <div className="mt-2 flex items-start gap-2 text-[11px] text-emerald-800 bg-white/60 border border-emerald-100 rounded-lg px-3 py-2">
            <span className="font-semibold text-emerald-700">Selected:</span>
            <span className="line-clamp-2">{selectedText}</span>
            <button
              onClick={onDeselectSelection}
              className="ml-auto p-1 rounded-md text-emerald-700 hover:bg-emerald-100"
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
        {!text && !autoSuggestions.length && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
            <div className="space-y-2">
              <p>Start typing to see automatic AI suggestions.</p>
              <p className="text-xs text-slate-500">Features: Auto Translation, Spelling & Grammar correction</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Show sequential suggestions (auto-detected) */}
        {sequentialSuggestions.length > 0 && (
          <SequentialSuggestionCard
            suggestions={sequentialSuggestions}
            original={currentAnalyzedText}
            onApply={handleApplySequential}
            onDismiss={handleDismissSequential}
            loading={loading}
            appliedTypes={appliedChanges}
          />
        )}

        {/* Show auto-suggestions (News Mode, etc.) */}
        {autoSuggestions.map((suggestion) => (
          <AISuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onApply={onApplySuggestion || (() => {})}
            onDismiss={() => onApplySuggestion?.({ ...suggestion, _dismiss: true })}
          />
        ))}

        {loading && !sequentialSuggestions.length && (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            Analyzing your text when you stop typing...
          </div>
        )}
      </div>

      {/* Typing stop detector - invisible component */}
      <TypingStopDetector
        text={text}
        onStopTyping={handleStopTyping}
        debounceMs={1500}
        minLength={3}
      />
    </div>
  )
}