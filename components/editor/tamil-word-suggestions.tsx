"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Sparkles, Type } from "lucide-react"
import { thanglishConverter } from "@/lib/ai/thanglish-converter"

interface WordSuggestion {
  word: string
  type: "tamil" | "english" | "suggestion"
  confidence?: number
}

interface TamilWordSuggestionsProps {
  text: string
  cursorPosition: number
  onSelectWord: (word: string) => void
  onTextChange: (text: string) => void
}

export function TamilWordSuggestions({
  text,
  cursorPosition,
  onSelectWord,
  onTextChange
}: TamilWordSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<WordSuggestion[]>([])
  const [currentWord, setCurrentWord] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Get current word at cursor position
  const getCurrentWord = useCallback((text: string, cursorPos: number) => {
    const beforeCursor = text.substring(0, cursorPos)
    const words = beforeCursor.split(/\s+/)
    return words[words.length - 1] || ""
  }, [])

  // Generate Tamil word suggestions
  const generateSuggestions = useCallback((word: string) => {
    if (!word || word.length < 2) {
      setSuggestions([])
      return
    }

    const wordSuggestions: WordSuggestion[] = []
    const convertedWord = thanglishConverter.convert(word)

    // Primary conversion
    if (convertedWord && convertedWord !== word) {
      wordSuggestions.push({
        word: convertedWord,
        type: "tamil",
        confidence: 0.95
      })
    }

    // Common Tamil variations
    const commonTamilWords: { [key: string]: string[] } = {
      "naan": ["நான்", "நானால்", "நான் தான்"],
      "nee": ["நீ", "நீயாக", "நீயும்"],
      "enga": ["இங்கே", "இங்க", "இங்கேயே"],
      "vanakkam": ["வணக்கம்", "வணக்கம் நண்பகளே"],
      "nandri": ["நன்றி", "நன்றிகள்", "மிக்க நன்றி"],
      "epdi": ["எப்படி", "எப்படி இருக்கிறீர்களா"],
      "enna": ["என்ன", "என்னாச்சும்", "என்ன செய்கிறீர்கள்"],
      "po": ["போ", "போங்க", "போறேன்"],
      "va": ["வா", "வாங்க", "வருகிறேன்"],
      "pan": ["பண்ணுங்க", "பண்ணும்", "பண்ண"],
      "iru": ["இரு", "இருங்க", "இருக்கிறேன்"],
      "sari": ["சரி", "சரியாக இருக்கிறது", "சரித்தான்"],
      "romba": ["ரொம்ப", "மிகவும்", "அதிகமாக"],
      "neram": ["நேரம்", "நேரம் ஆகிவிட்டது", "வேளை"],
      "kalai": ["காலை", "காலை வணக்கம்", "நல்ல காலை"],
      "malai": ["மாலை", "மாலை வணக்கம்", "இனிய மாலை"],
    }

    // Add variations for common words
    if (commonTamilWords[word.toLowerCase()]) {
      commonTamilWords[word.toLowerCase()].forEach((variation, index) => {
        if (!wordSuggestions.find(s => s.word === variation)) {
          wordSuggestions.push({
            word: variation,
            type: "suggestion",
            confidence: 0.85 - (index * 0.05)
          })
        }
      })
    }

    // Add English alternatives
    const englishAlternatives: { [key: string]: string } = {
      "hello": "vanakkam",
      "thank": "nandri",
      "good": "nalla",
      "yes": "aam",
      "no": "illa",
      "please": "dayavu seithu",
      "sorry": "mannichungal",
      "welcome": "vandukal welcome"
    }

    const lowerWord = word.toLowerCase()
    if (englishAlternatives[lowerWord]) {
      const tamilEquivalent = thanglishConverter.convert(englishAlternatives[lowerWord])
      wordSuggestions.push({
        word: tamilEquivalent,
        type: "suggestion",
        confidence: 0.75
      })
    }

    // Sort by confidence and limit to 8 suggestions
    setSuggestions(wordSuggestions
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, 8))
  }, [])

  // Update current word and suggestions
  useEffect(() => {
    const word = getCurrentWord(text, cursorPosition)
    setCurrentWord(word)
    setShowSuggestions(word.length >= 2)
    generateSuggestions(word)
    setSelectedIndex(0)
  }, [text, cursorPosition, getCurrentWord, generateSuggestions])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % suggestions.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
          break
        case 'Enter':
        case 'Tab':
          e.preventDefault()
          selectSuggestion(suggestions[selectedIndex])
          break
        case 'Escape':
          e.preventDefault()
          setShowSuggestions(false)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showSuggestions, suggestions, selectedIndex])

  const selectSuggestion = (suggestion: WordSuggestion) => {
    const beforeCursor = text.substring(0, cursorPosition)
    const afterCursor = text.substring(cursorPosition)
    const words = beforeCursor.split(/\s+/)

    // Replace the current word with the suggestion
    words[words.length - 1] = suggestion.word
    const newText = words.join(' ') + afterCursor
    const newCursorPosition = words.slice(0, -1).join(' ').length + suggestion.word.length + 1

    onTextChange(newText)
    onSelectWord(suggestion.word)
    setShowSuggestions(false)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "tamil": return "bg-green-100 text-green-800 border-green-300"
      case "english": return "bg-blue-100 text-blue-800 border-blue-300"
      case "suggestion": return "bg-purple-100 text-purple-800 border-purple-300"
      default: return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tamil": return "த"
      case "english": return "En"
      case "suggestion": return "💡"
      default: return "?"
    }
  }

  if (!showSuggestions || suggestions.length === 0) {
    return null
  }

  return (
    <Card
      ref={suggestionsRef}
      className="absolute z-50 w-80 shadow-lg border-2 bg-background/95 backdrop-blur-sm"
      style={{
        top: "100%",
        left: "0",
        marginTop: "4px"
      }}
    >
      <CardContent className="p-2">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b">
          <Type className="w-3 h-3 text-primary" />
          <span className="text-xs font-medium">Tamil Word Suggestions</span>
          <Sparkles className="w-3 h-3 text-yellow-500" />
        </div>

        <div className="max-h-48 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                index === selectedIndex
                  ? "bg-primary/10 border border-primary/30"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => selectSuggestion(suggestion)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Badge
                  variant="outline"
                  className={`text-xs px-1.5 py-0.5 ${getTypeColor(suggestion.type)}`}
                >
                  {getTypeIcon(suggestion.type)}
                </Badge>
                <span className="text-sm font-medium truncate">
                  {suggestion.word}
                </span>
              </div>

              {suggestion.confidence && (
                <div className="text-xs text-muted-foreground">
                  {Math.round(suggestion.confidence * 100)}%
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs text-muted-foreground">
          <span>↑↓ Navigate • Enter/Tab to select • Esc to close</span>
          <span>{currentWord}</span>
        </div>
      </CardContent>
    </Card>
  )
}