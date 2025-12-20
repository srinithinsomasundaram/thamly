"use client"

interface SuggestionPopupProps {
  suggestions: string[]
  selectedWord: string
  onSelect: (suggestion: string) => void
}

export default function SuggestionPopup({ suggestions, selectedWord, onSelect }: SuggestionPopupProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden w-64">
      <div className="max-h-80 overflow-y-auto">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion)}
            className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors text-left ${
              index === 0 ? "bg-purple-50 hover:bg-purple-100" : "hover:bg-gray-50"
            } ${index < suggestions.length - 1 ? "border-b border-gray-100" : ""}`}
          >
            {/* Icon with number or dot */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                index === 0 ? "bg-purple-500 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {index === 0 ? <div className="w-2 h-2 bg-white rounded-full" /> : <span>{index}</span>}
            </div>
            <span className={`text-sm ${index === 0 ? "font-semibold text-gray-900" : "text-gray-700"}`}>
              {suggestion}
            </span>
          </button>
        ))}
      </div>

      {/* Footer with keyboard shortcut */}
      <div className="border-t border-gray-100 px-4 py-2 bg-gray-50 text-xs text-gray-600 flex items-center gap-1.5">
        Press{" "}
        <kbd className="bg-white px-2 py-0.5 rounded text-gray-900 font-mono border border-gray-300 text-xs leading-none">
          Space
        </kbd>{" "}
        to select first option
      </div>
    </div>
  )
}
