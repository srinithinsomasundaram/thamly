"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, X, Loader2, AlertCircle, CheckCircle, Globe, SpellCheck, Edit, FileText, Zap, PenTool, BarChart } from "lucide-react"
import { TypingStopDetector } from "@/components/editor/typing-stop-detector"

interface UnifiedResponse {
  grammar: string
  spelling: string
  formal: string
  translation: string
  sentenceFormation: string
  clarity: string
  score: number
}

interface ThamlyAssistantPanelProps {
  text: string
  selectedText?: string
  onApplySuggestion?: (type: string, original: string, suggestion: string) => void
  onDeselectSelection?: () => void
  autoSuggestions?: any[]
  onNewsMode?: () => void
}

export function ThamlyAssistantPanel({
  text,
  selectedText,
  onApplySuggestion,
  onDeselectSelection,
  autoSuggestions = [],
  onNewsMode
}: ThamlyAssistantPanelProps) {
  const [unifiedResponse, setUnifiedResponse] = useState<UnifiedResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [currentAnalyzedText, setCurrentAnalyzedText] = useState<string>("")
  const [activeModel, setActiveModel] = useState<string | null>(null)

  // Handle typing stop detection
  const handleStopTyping = async (textToAnalyze: string) => {
    if (textToAnalyze === currentAnalyzedText) return
    setCurrentAnalyzedText(textToAnalyze)

    setLoading(true)
    setError("")
    setActiveModel("unified")

    try {
      const res = await fetch("/api/thamly/unified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToAnalyze }),
      })

      if (!res.ok) {
        throw new Error("Analysis failed")
      }

      const data = await res.json()
      setUnifiedResponse(data)
    } catch (err) {
      console.error("Thamly analysis failed:", err)
      setError("Couldn't analyze text. Try again.")
    } finally {
      setLoading(false)
      setActiveModel(null)
    }
  }

  const handleApplyModel = (modelType: string, suggestion: string) => {
    const original = selectedText || currentAnalyzedText || text
    onApplySuggestion?.(modelType, original, suggestion)

    // Update the unified response to reflect applied change
    if (unifiedResponse) {
      setUnifiedResponse({
        ...unifiedResponse,
        [modelType]: suggestion
      })
    }
  }

  const modelConfigs = [
    {
      key: 'translation',
      label: 'மொழிபெயர்ப்பு',
      englishLabel: 'Translation',
      icon: Globe,
      color: 'emerald',
      description: 'Translate between Tamil and English'
    },
    {
      key: 'grammar',
      label: 'இலக்கணம்',
      englishLabel: 'Grammar',
      icon: Edit,
      color: 'blue',
      description: 'Fix grammar and sentence structure'
    },
    {
      key: 'spelling',
      label: 'சொல்லியல்',
      englishLabel: 'Spelling',
      icon: SpellCheck,
      color: 'amber',
      description: 'Correct spelling mistakes'
    },
    {
      key: 'formal',
      label: 'முறையான',
      englishLabel: 'Formal',
      icon: FileText,
      color: 'purple',
      description: 'Convert to formal/professional Tamil'
    },
    {
      key: 'sentenceFormation',
      label: 'வாக்கிய அமைப்பு',
      englishLabel: 'Sentence',
      icon: PenTool,
      color: 'indigo',
      description: 'Improve sentence flow and clarity'
    },
    {
      key: 'clarity',
      label: 'தெளிவு',
      englishLabel: 'Clarity',
      icon: Zap,
      color: 'rose',
      description: 'Make text clearer and more readable'
    }
  ]

  const hasChanges = (original: string, suggestion: string) => {
    return original.trim() !== suggestion.trim()
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 50) return 'text-amber-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-100'
    if (score >= 70) return 'bg-blue-100'
    if (score >= 50) return 'bg-amber-100'
    return 'bg-red-100'
  }

  return (
    <div className="w-full h-full flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm sticky top-4">
      {/* Header */}
      <div className="border-b-4 border-gradient-to-r from-emerald-500 to-blue-500 bg-gradient-to-r from-emerald-50 to-blue-50 px-4 py-3 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-700" />
            <p className="text-sm font-semibold text-emerald-900">Thamly AI Assistant</p>
            {loading && (
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-3">
            {onNewsMode && (
              <Button
                onClick={onNewsMode}
                size="sm"
                className="px-3 py-1 text-xs bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              >
                📰 News Mode
              </Button>
            )}
            {unifiedResponse && (
              <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getScoreBg(unifiedResponse.score)} ${getScoreColor(unifiedResponse.score)}`}>
                Score: {unifiedResponse.score}/100
              </div>
            )}
          </div>
        </div>
        {selectedText && (
          <div className="mt-2 text-xs text-emerald-800 bg-white/60 border border-emerald-100 rounded-lg px-3 py-2">
            <span className="font-semibold">Selected:</span> {selectedText}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!text && !autoSuggestions.length && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Start typing for AI suggestions</h3>
            <p className="text-xs text-gray-600">Auto-detects when you stop typing</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Unified Response Cards */}
        {unifiedResponse && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              AI Suggestions
            </div>

            {modelConfigs.map((model) => {
              const Icon = model.icon
              const suggestion = unifiedResponse[model.key as keyof UnifiedResponse]
              const original = selectedText || currentAnalyzedText || text
              const suggestionText = String(suggestion || "")
              const isChanged = hasChanges(original, suggestionText)

              return (
                <div
                  key={model.key}
                  className={`rounded-lg border-2 ${
                    isChanged ? 'border-' + model.color + '-300' : 'border-gray-200'
                  } bg-white overflow-hidden transition-all hover:shadow-md`}
                >
                  <div className={`px-3 py-2 border-b ${
                    isChanged ? 'border-' + model.color + '-200' : 'border-gray-100'
                  } bg-gray-50`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 text-${model.color}-600`} />
                        <span className="text-sm font-medium">{model.label}</span>
                        <span className="text-xs text-gray-500">({model.englishLabel})</span>
                      </div>
                      {isChanged && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                          Change
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="text-xs text-gray-500">{model.description}</div>
                    <div className={`p-2 rounded bg-${model.color}-50 text-${model.color}-900 text-sm font-medium`}>
                      {suggestion}
                    </div>
                    {isChanged && (
                      <Button
                        size="sm"
                        onClick={() => handleApplyModel(model.key, String(suggestion))}
                        className="w-full h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Apply {model.englishLabel}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Auto-suggestions like News Mode */}
        {autoSuggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="rounded-2xl border-2 border-emerald-300 bg-white shadow-sm overflow-hidden animate-pulse-slow"
          >
            <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-orange-50">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-700" />
                <span className="text-sm font-semibold">{suggestion.title}</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {suggestion.original && (
                <div className="text-xs text-gray-500">Original:</div>
              )}
              <div className="whitespace-pre-wrap">{suggestion.suggested}</div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onApplySuggestion?.(suggestion.type, suggestion.original, suggestion.suggested)}
                  className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {/* Handle dismiss */}}
                  className="flex-1 h-8 text-xs"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        ))}

        {loading && !unifiedResponse && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-600">Analyzing with Thamly models...</p>
          </div>
        )}
      </div>

      {/* Typing stop detector - invisible */}
      <TypingStopDetector
        text={text}
        onStopTyping={handleStopTyping}
        debounceMs={1500}
        minLength={3}
      />
    </div>
  )
}