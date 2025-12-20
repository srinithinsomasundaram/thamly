"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, X, Loader2, Globe, SpellCheck, Edit } from "lucide-react"

interface Suggestion {
  type: 'translation' | 'spelling' | 'grammar'
  tamil: string
  hasChange: boolean
}

interface SequentialSuggestionCardProps {
  suggestions: Suggestion[]
  original: string
  onApply: (tamil: string, type: 'translation' | 'spelling' | 'grammar') => void
  onDismiss: () => void
  loading?: boolean
  appliedTypes: Set<string>
}

export function SequentialSuggestionCard({
  suggestions,
  original,
  onApply,
  onDismiss,
  loading = false,
  appliedTypes
}: SequentialSuggestionCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-advance to next suggestion after applying one
  useEffect(() => {
    if (suggestions.length > 0 && currentIndex < suggestions.length) {
      const currentSuggestion = suggestions[currentIndex]
      if (appliedTypes.has(currentSuggestion.type)) {
        // This type was already applied, move to next
        if (currentIndex < suggestions.length - 1) {
          setCurrentIndex(currentIndex + 1)
        }
      }
    }
  }, [appliedTypes, currentIndex, suggestions])

  if (suggestions.length === 0) return null

  // Find the first unapplied suggestion
  let displayIndex = currentIndex
  while (displayIndex < suggestions.length && appliedTypes.has(suggestions[displayIndex].type)) {
    displayIndex++
  }

  if (displayIndex >= suggestions.length) {
    // All suggestions applied or no changes needed
    return null
  }

  const currentSuggestion = suggestions[displayIndex]

  const typeConfig = {
    translation: {
      label: 'மொழிபெயர்ப்பு (Translation)',
      icon: Globe,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    spelling: {
      label: 'சொல்லியல் (Spelling)',
      icon: SpellCheck,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    grammar: {
      label: 'இலக்கணம் (Grammar)',
      icon: Edit,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  }

  const config = typeConfig[currentSuggestion.type]
  const Icon = config.icon

  const handleApply = () => {
    onApply(currentSuggestion.tamil, currentSuggestion.type)
    // Move to next suggestion after a short delay
    setTimeout(() => {
      if (displayIndex < suggestions.length - 1) {
        setCurrentIndex(displayIndex + 1)
      }
    }, 500)
  }

  return (
    <div className={`rounded-2xl border-2 ${config.borderColor} ${config.bgColor} shadow-lg overflow-hidden animate-pulse-slow`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${config.borderColor} bg-white/80`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-800">{config.label}</span>
              <div className="text-xs text-gray-600">
                Suggestion {displayIndex + 1} of {suggestions.length}
              </div>
            </div>
          </div>
          {currentSuggestion.hasChange && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
              மாற்றம் உள்ளது
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Original text */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            அசல் உரை (Original):
          </div>
          <div className="p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800">
            {original}
          </div>
        </div>

        {/* Suggestion */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            பரிந்துரை (Suggestion):
          </div>
          <div className={`p-3 border rounded-lg text-sm font-medium ${config.bgColor} ${config.borderColor} ${config.color}`}>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>செயலாக்குகிறது...</span>
              </div>
            ) : (
              <div className="tamil-text" style={{ fontSize: '16px', lineHeight: '1.6' }}>
                {currentSuggestion.tamil}
              </div>
            )}
          </div>
        </div>

        {!currentSuggestion.hasChange && !loading && (
          <div className="text-xs text-gray-500 italic text-center bg-gray-100 rounded-lg p-2">
            மாற்றங்கள் தேவையில்லை (No changes needed)
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 py-3 bg-white/80 border-t border-gray-200">
        <Button
          onClick={handleApply}
          disabled={loading || !currentSuggestion.hasChange}
          className="flex-1 h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300"
        >
          {loading ? (
            "செயலாக்குகிறது..."
          ) : (
            "ஏற்றுக்கொள் (Apply)"
          )}
        </Button>
        <Button
          onClick={() => {
            if (displayIndex < suggestions.length - 1) {
              setCurrentIndex(displayIndex + 1)
            } else {
              onDismiss()
            }
          }}
          variant="outline"
          className="flex-1 h-9 text-xs font-semibold border-gray-300 hover:bg-gray-100"
        >
          {displayIndex < suggestions.length - 1 ? "அடுத்து (Next)" : "புறக்கணிக்க (Dismiss)"}
        </Button>
      </div>
    </div>
  )
}