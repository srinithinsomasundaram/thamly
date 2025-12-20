"use client"

import { useEffect, useState } from "react"
import { Sparkles, CheckCircle, X, Loader2, AlertCircle } from "lucide-react"
import { AISuggestionCard, type AISuggestion } from "@/components/ai-suggestion-card"
import { UnifiedSuggestionCardNew } from "@/components/unified-suggestion-card-new"

interface AIAssistantPanelProps {
  text: string
  isAnalyzing?: boolean
  onApplySuggestion?: (suggestion: AISuggestion) => void
  onDeselectSelection?: () => void
  selectedText?: string
  wordAtCursor?: string
  user?: any
  autoSuggestions?: AISuggestion[]
  onNewsMode?: () => void
}

export { type AISuggestion }

export function AIAssistantPanelNew({
  selectedText,
  onApplySuggestion,
  onDeselectSelection,
  user,
  autoSuggestions = [],
  onNewsMode,
}: AIAssistantPanelProps) {
  const [unifiedResponse, setUnifiedResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [analysisKey, setAnalysisKey] = useState(0)

  // Call unified API when text is selected
  useEffect(() => {
    const trimmed = selectedText?.trim() || ""
    if (!trimmed) {
      setUnifiedResponse(null)
      setError("")
      setLoading(false)
      return
    }

    let cancelled = false
    const analyze = async () => {
      setLoading(true)
      setError("")
      try {
        const res = await fetch("/api/ai/unified", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ text: trimmed }),
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          setError(errorData.error || `Server error: ${res.status}`)
          return
        }

        const data = await res.json()

        if (!cancelled) {
          setUnifiedResponse(data)
        }
      } catch (err) {
        console.error("Unified analysis failed:", err)
        if (!cancelled) {
          setError("Couldn't analyze selection. Try again.")
          setUnifiedResponse(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void analyze()
    return () => {
      cancelled = true
    }
  }, [selectedText, analysisKey])

  const handleApplyUnified = (text: string, type: 'spelling' | 'grammar' | 'translation') => {
    const suggestion: AISuggestion = {
      id: `unified-${type}-${Date.now()}`,
      type: type,
      title: type === 'translation' ? 'Translation' : type === 'grammar' ? 'Grammar' : 'Spelling',
      original: selectedText || '',
      suggested: text,
      reason: `Applied ${type} correction`
    }
    onApplySuggestion?.(suggestion)
    setAnalysisKey((k) => k + 1)
  }

  const handleDismissUnified = () => {
    setUnifiedResponse(null)
    setError("")
  }

  // Merge auto-suggestions (like News Mode) with unified response
  const hasAutoSuggestions = autoSuggestions.length > 0
  const hasUnifiedResponse = unifiedResponse && !loading && !error

  return (
    <div className="w-full h-full flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm sticky top-4">
      <div className="border-b-4 border-emerald-500 bg-emerald-50 px-4 py-3 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-700" />
            <p className="text-sm font-semibold text-emerald-900">AI Assistant</p>
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
              {loading ? "Analyzing…" : hasAutoSuggestions || hasUnifiedResponse ? "Ready" : "Idle"}
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
        {!selectedText && !hasAutoSuggestions && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
            <div className="space-y-2">
              <p>Select a sentence to see AI suggestions.</p>
              <p className="text-xs text-slate-500">Features: Translation, Spelling, Grammar & News Mode</p>
            </div>
          </div>
        )}

        {!selectedText && hasAutoSuggestions && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-800">
            <p className="font-medium mb-1">Auto-suggestions available</p>
            <p className="text-xs text-emerald-600">Review the suggestions below.</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Show unified response with tabs */}
        {hasUnifiedResponse && (
          <UnifiedSuggestionCardNew
            suggestions={unifiedResponse}
            original={selectedText || ''}
            onApply={handleApplyUnified}
            onDismiss={handleDismissUnified}
            loading={loading}
          />
        )}

        {/* Show auto-suggestions (News Mode, etc.) */}
        {hasAutoSuggestions && autoSuggestions.map((suggestion) => (
          <AISuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onApply={onApplySuggestion || (() => {})}
            onDismiss={() => onApplySuggestion?.({ ...suggestion, _dismiss: true })}
          />
        ))}

        {loading && (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            Analyzing your selection…
          </div>
        )}
      </div>
    </div>
  )
}