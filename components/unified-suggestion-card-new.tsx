"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, X, Loader2, Globe, SpellCheck, Edit } from "lucide-react"

interface UnifiedSuggestion {
  spelling: string
  grammar: string
  translation?: string | null
  score: number
}

interface UnifiedSuggestionCardProps {
  suggestions: UnifiedSuggestion
  original: string
  onApply: (text: string, type: 'spelling' | 'grammar' | 'translation') => void
  onDismiss: () => void
  loading?: boolean
}

export function UnifiedSuggestionCardNew({
  suggestions,
  original,
  onApply,
  onDismiss,
  loading = false
}: UnifiedSuggestionCardProps) {
  const [activeTab, setActiveTab] = useState<'spelling' | 'grammar' | 'translation'>(
    suggestions.translation ? 'translation' : 'grammar'
  )

  const tabs = [
    ...(suggestions.translation ? [{
      id: 'translation' as const,
      label: 'Translation',
      icon: Globe,
      color: 'text-emerald-600'
    }] : []),
    {
      id: 'grammar' as const,
      label: 'Grammar',
      icon: Edit,
      color: 'text-blue-600'
    },
    {
      id: 'spelling' as const,
      label: 'Spelling',
      icon: SpellCheck,
      color: 'text-amber-600'
    }
  ]

  const getCurrentSuggestion = () => {
    switch (activeTab) {
      case 'spelling':
        return suggestions.spelling
      case 'grammar':
        return suggestions.grammar
      case 'translation':
        return suggestions.translation || ''
      default:
        return suggestions.grammar
    }
  }

  const hasChanges = original !== getCurrentSuggestion()

  return (
    <div className="rounded-2xl border-2 border-emerald-300 bg-white shadow-lg overflow-hidden">
      {/* Header with score */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 px-4 py-3 border-b border-emerald-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-700" />
            </div>
            <span className="text-sm font-semibold text-gray-800">AI Suggestions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">Score:</span>
            <span className={`text-sm font-bold ${
              suggestions.score >= 90 ? 'text-emerald-600' :
              suggestions.score >= 70 ? 'text-blue-600' : 'text-amber-600'
            }`}>
              {suggestions.score}%
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 border-b-2 border-emerald-500 -mb-[1px]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${activeTab === tab.id ? tab.color : 'text-gray-500'}`} />
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Original text */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Original:</div>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 font-medium">
            {original}
          </div>
        </div>

        {/* Suggestion */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {activeTab === 'translation' ? 'Tamil Translation:' : 'Suggestion:'}
          </div>
          <div className={`p-3 border rounded-lg text-sm font-medium whitespace-pre-wrap ${
            activeTab === 'translation'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              getCurrentSuggestion()
            )}
          </div>
        </div>

        {!hasChanges && !loading && (
          <div className="text-xs text-gray-500 italic text-center">
            No changes needed for {activeTab}.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 py-3 bg-gray-50 border-t border-gray-200">
        <Button
          onClick={() => onApply(getCurrentSuggestion(), activeTab)}
          disabled={loading || !hasChanges}
          className="flex-1 h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300"
        >
          {loading ? "Processing..." : "Apply"}
        </Button>
        <Button
          onClick={onDismiss}
          variant="outline"
          className="flex-1 h-9 text-xs font-semibold border-gray-300 hover:bg-gray-100"
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}