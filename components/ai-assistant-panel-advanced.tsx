"use client"

import { useEffect, useMemo, useState } from "react"
import { Sparkles, CheckCircle, X, Loader2, AlertCircle } from "lucide-react"
import { AISuggestionCard, type AISuggestion } from "@/components/ai-suggestion-card"
import { UnifiedSuggestionCard } from "@/components/unified-suggestion-card"

interface AIAssistantPanelProps {
  text: string
  isAnalyzing?: boolean
  onApplySuggestion?: (suggestion: AISuggestion) => void
  onDeselectSelection?: () => void
  selectedText?: string
  wordAtCursor?: string
  user?: any
  autoSuggestions?: AISuggestion[]  // Add auto-suggestions from main component
  onNewsMode?: () => void
}

type UnifiedResponse = {
  input: string
  language: "tam" | "thanglish" | "eng" | "mixed"
  spelling: { corrected: string }
  grammar: { corrected: string }
  translation: { tamil: string | null }
  tone?: { current: "formal" | "informal" | "neutral"; options: string[] }
  score?: number
  explanations?: string[]
  best?: string
}

export { type AISuggestion }

export function AIAssistantPanel({
  selectedText,
  onApplySuggestion,
  onDeselectSelection,
  user,
  autoSuggestions = [], // Default to empty array
  onNewsMode,
}: AIAssistantPanelProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [analysisKey, setAnalysisKey] = useState(0)
  const [viewMode, setViewMode] = useState<'unified' | 'individual'>('unified')

  const typeOrder = useMemo(() => ["translation", "spelling", "grammar", "improvement", "tone"] as const, [])

  // Merge auto-suggestions with AI-generated suggestions
  const allSuggestions = useMemo(() => {
    const merged = [...autoSuggestions]

    // Add AI-generated suggestions, avoiding duplicates by original text
    suggestions.forEach(aiSuggestion => {
      const duplicate = merged.find(auto => auto.original === aiSuggestion.original && auto.type === aiSuggestion.type)
      if (!duplicate) {
        merged.push(aiSuggestion)
      }
    })

    // Sort by type order and then by recency
    return merged.sort((a, b) => {
      const orderA = typeOrder.indexOf(a.type as (typeof typeOrder)[number])
      const orderB = typeOrder.indexOf(b.type as (typeof typeOrder)[number])
      if (orderA !== orderB) {
        return (orderA === -1 ? 99 : orderA) - (orderB === -1 ? 99 : orderB)
      }
      // If same type, keep recent ones first (auto-suggestions should come first)
      return 0
    })
  }, [autoSuggestions, suggestions, typeOrder])

  // API calls are now unrestricted - no auth required

  useEffect(() => {
    const trimmed = selectedText?.trim() || ""
    if (!trimmed) {
      setSuggestions([])
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

          // Handle specific error types
          if (res.status === 429) {
            if (errorData.code === 'RATE_LIMIT_EXCEEDED') {
              setError(`Too many requests. Please wait ${Math.ceil((errorData.resetIn || 60000) / 1000)} seconds.`)
            } else if (errorData.code === 'USAGE_LIMIT_EXCEEDED') {
              const limit = errorData.limit || 'daily'
              const remaining = errorData.remaining || 0
              setError(`Daily limit (${limit}) reached. ${remaining} requests remaining today.`)
            } else {
              setError('Rate limit exceeded. Please try again later.')
            }
          } else if (res.status === 401) {
            setError('Please sign in to use AI suggestions')
          } else {
            setError(errorData.error || `Server error: ${res.status}`)
          }
          return
        }

        const data: UnifiedResponse = await res.json()
        const cards: AISuggestion[] = []
        const baseExplanation = data.explanations?.[0]
        const isEnglish = ["eng", "mixed", "thanglish"].includes(data.language)
        const original = data.input || trimmed

        if (data.translation?.tamil) {
          cards.push({
            id: `translation-${Date.now()}`,
            type: "translation",
            title: "Translation",
            original,
            suggested: data.translation.tamil,
            reason: baseExplanation || "Translated to natural Tamil.",
          })
        }

        if (data.spelling?.corrected && data.spelling.corrected !== original) {
          cards.push({
            id: `spelling-${Date.now() + 1}`,
            type: "spelling",
            title: "Spelling",
            original,
            suggested: data.spelling.corrected,
            reason: data.explanations?.[1] || "Corrected Tamil spelling.",
          })
        }

        const grammarBase = data.spelling?.corrected || original
        if (data.grammar?.corrected && data.grammar.corrected !== grammarBase) {
          cards.push({
            id: `grammar-${Date.now() + 2}`,
            type: "grammar",
            title: "Grammar",
            original: grammarBase,
            suggested: data.grammar.corrected,
            reason: data.explanations?.[2] || "Polished grammar and agreement.",
          })
        }

        // If English input but no translation available, use best Tamil output
        if (isEnglish && !data.translation?.tamil) {
          cards.push({
            id: `translation-fallback-${Date.now()}`,
            type: "translation",
            title: "Translation",
            original,
            suggested: data.best || data.grammar?.corrected || "தமிழ் மொழிபெயர்ப்பு கிடைக்கவில்லை.",
            reason: "English detected; showing best Tamil rendering.",
          })
        }

        const ordered = cards.sort((a, b) => {
          const orderA = typeOrder.indexOf(a.type as (typeof typeOrder)[number])
          const orderB = typeOrder.indexOf(b.type as (typeof typeOrder)[number])
          return (orderA === -1 ? 99 : orderA) - (orderB === -1 ? 99 : orderB)
        })

        if (!cancelled) {
          setSuggestions(ordered)
        }
      } catch (err) {
        console.error("Unified analysis failed:", err)
        if (!cancelled) {
          setError("Couldn't analyze selection. Try again.")
          setSuggestions([])
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
  }, [selectedText, analysisKey, typeOrder])

  const handleApply = (suggestion: AISuggestion) => {
    onApplySuggestion?.(suggestion)
    setAnalysisKey((k) => k + 1)
  }

  const handleApplyAll = () => {
    allSuggestions.forEach((s) => onApplySuggestion?.(s))
    setAnalysisKey((k) => k + 1)
  }

  const handleDismissAll = () => {
    setSuggestions([])
    // Signal to parent to clear all auto suggestions and text issues
    onApplySuggestion?.({_dismiss: true, _dismissAll: true} as unknown as AISuggestion)
  }

  const handleDismissSuggestion = (id: string) => {
    // Check if it's an auto-suggestion
    const isAutoSuggestion = autoSuggestions.find(s => s.id === id)

    if (isAutoSuggestion) {
      // For auto-suggestions, signal to parent to remove it
      onApplySuggestion?.({ ...isAutoSuggestion, _dismiss: true })
    } else {
      // For AI-generated suggestions, remove from local state
      setSuggestions((prev) => prev.filter((s) => s.id !== id))
    }
  }

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
            {allSuggestions.length > 0 && (
              <button
                onClick={() => setViewMode(viewMode === 'unified' ? 'individual' : 'unified')}
                className="text-xs px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                title={`Switch to ${viewMode === 'unified' ? 'individual' : 'unified'} view`}
              >
                {viewMode === 'unified' ? 'Individual' : 'Unified'}
              </button>
            )}
            <div className="text-xs font-semibold text-emerald-800">
              {loading ? "Analyzing…" : `${allSuggestions.length} suggestion${allSuggestions.length === 1 ? "" : "s"}`}
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
        {!selectedText && autoSuggestions.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
            <div className="space-y-2">
              <p>Select a sentence to see spelling, grammar, and translation suggestions.</p>
              <p className="text-xs text-slate-500">Auto-suggestions will appear here as you type.</p>
            </div>
          </div>
        )}

        {!selectedText && autoSuggestions.length > 0 && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-800">
            <p className="font-medium mb-1">Auto-suggestions detected</p>
            <p className="text-xs text-emerald-600">Review the suggestions below or select text for more options.</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {allSuggestions.length > 0 && viewMode === 'unified' && (
          <UnifiedSuggestionCard
            suggestions={allSuggestions}
            onApplyAll={handleApplyAll}
            onApplySuggestion={handleApply}
            onDismiss={handleDismissSuggestion}
            onDismissAll={handleDismissAll}
          />
        )}

        {allSuggestions.length > 0 && viewMode === 'individual' && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle className="h-4 w-4" />
              </span>
              {allSuggestions.length} suggestion{allSuggestions.length === 1 ? "" : "s"} found
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('unified')}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
              >
                Unified View
              </button>
              <button
                onClick={handleApplyAll}
                disabled={allSuggestions.length === 0}
                className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 transition disabled:opacity-50"
              >
                Accept All
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            Analyzing your selection…
          </div>
        )}

        {viewMode === 'individual' && allSuggestions.map((suggestion) => (
          <AISuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onApply={handleApply}
            onDismiss={() => {
              // For auto-suggestions, we need to handle removal differently
              if (autoSuggestions.find(s => s.id === suggestion.id)) {
                // This will be handled by the parent component
                onApplySuggestion?.({...suggestion, _dismiss: true})
              } else {
                setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id))
              }
            }}
          />
        ))}

        {allSuggestions.length === 0 && !loading && selectedText && !error && (
          <p className="text-xs text-slate-500 text-center">
            No issues found. Try selecting a different sentence.
          </p>
        )}
      </div>
    </div>
  )
}
