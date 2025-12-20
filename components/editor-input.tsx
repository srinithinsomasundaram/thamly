"use client"

import type React from "react"
import { useRef, useState } from "react"
import SuggestionPopup from "./suggestion-popup"
import { getCaretCoordinates, getTamilSuggestions } from "@/lib/helpers"

interface EditorInputProps {
  value: string
  setValue: (value: string) => void
  onAIAnalysis?: () => void
}

export function EditorInput({ value, setValue, onAIAnalysis }: EditorInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showPopup, setShowPopup] = useState(false)
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 })
  const [selectedWord, setSelectedWord] = useState("")
  const [wordBounds, setWordBounds] = useState({ startIdx: 0, endIdx: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  function getSurroundingContext(text: string, wordStartIdx: number, wordEndIdx: number): string {
    const sentenceStart = Math.max(0, text.lastIndexOf("।", wordStartIdx - 1) + 1)
    const sentenceEnd = Math.min(text.length, text.indexOf("।", wordEndIdx) + 1 || text.length)
    return text.substring(sentenceStart, sentenceEnd).trim()
  }

  function getWordAtCursor(text: string, cursorPos: number): { word: string; startIdx: number; endIdx: number } {
    const beforeCursor = text.substring(0, cursorPos)
    const afterCursor = text.substring(cursorPos)

    const beforeMatch = beforeCursor.match(/\S*$/)
    const afterMatch = afterCursor.match(/^\S*/)

    const wordStart = cursorPos - (beforeMatch ? beforeMatch[0].length : 0)
    const wordEnd = cursorPos + (afterMatch ? afterMatch[0].length : 0)
    const word = text.substring(wordStart, wordEnd)

    return { word, startIdx: wordStart, endIdx: wordEnd }
  }

  async function fetchSuggestions(word: string, bounds: { startIdx: number; endIdx: number }): Promise<void> {
    if (!word || word.length < 1) {
      setShowPopup(false)
      return
    }

    setIsLoading(true)
    try {
      const context = getSurroundingContext(value, bounds.startIdx, bounds.endIdx)
      const sugs = await getTamilSuggestions(word, context)

      setSuggestions(sugs)
      setSelectedWord(word)
      setWordBounds(bounds)

      if (sugs.length > 0) {
        setShowPopup(true)
      } else {
        setShowPopup(false)
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      setShowPopup(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const inputValue = e.target.value
    const caretPos = textarea.selectionStart

    setValue(inputValue)

    requestAnimationFrame(() => {
      textarea.selectionStart = caretPos
      textarea.selectionEnd = caretPos

      const { word, startIdx, endIdx } = getWordAtCursor(inputValue, caretPos)

      if (word && word.length >= 1) {
        const coords = getCaretCoordinates(textarea, caretPos)
        setPopupPos({
          x: coords.left,
          y: coords.top + 25,
        })

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }

        debounceTimerRef.current = setTimeout(() => {
          fetchSuggestions(word, { startIdx, endIdx })
        }, 100)
      } else {
        setShowPopup(false)
      }
    })
  }

  const handleMouseUp = async (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart

    if (textarea.selectionStart !== textarea.selectionEnd) {
      const selectedText = value.substring(textarea.selectionStart, textarea.selectionEnd)
      await fetchSuggestions(selectedText, {
        startIdx: textarea.selectionStart,
        endIdx: textarea.selectionEnd,
      })
    } else {
      const { word, startIdx, endIdx } = getWordAtCursor(value, cursorPos)
      if (word && word.trim()) {
        await fetchSuggestions(word, { startIdx, endIdx })
      } else {
        setShowPopup(false)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.key === " " || e.key === "Tab" || e.key === "Enter") && showPopup && suggestions.length > 0) {
      e.preventDefault()
      replaceWord(suggestions[0])
      setShowPopup(false)
    } else if (e.key === "Escape") {
      setShowPopup(false)
    }
  }

  function replaceWord(newWord: string): void {
    const textarea = textareaRef.current
    if (!textarea) return

    const newText = value.substring(0, wordBounds.startIdx) + newWord + value.substring(wordBounds.endIdx)

    setValue(newText)

    requestAnimationFrame(() => {
      const newCursorPos = wordBounds.startIdx + newWord.length
      textarea.selectionStart = newCursorPos
      textarea.selectionEnd = newCursorPos
      textarea.focus()
    })
  }

  const wordCount = value
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length

  const acceptedCount = value.split(" ").filter((word) => suggestions.includes(word)).length

  return (
    <div className="relative w-full h-full flex flex-col bg-white rounded-lg border border-gray-200">
      <div className="flex-1 relative overflow-hidden">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onMouseUp={handleMouseUp}
          onKeyDown={handleKeyDown}
          className="w-full h-full p-6 outline-none text-base leading-relaxed bg-white text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none"
          placeholder="Start typing in Tamil or English (Thanglish)..."
        />

        {showPopup && suggestions.length > 0 && (
          <div className="absolute z-50" style={{ left: `${popupPos.x}px`, top: `${popupPos.y}px` }}>
            <SuggestionPopup
              suggestions={suggestions}
              selectedWord={selectedWord}
              onSelect={(suggestion: string) => {
                replaceWord(suggestion)
                setShowPopup(false)
              }}
            />
          </div>
        )}

        {isLoading && showPopup && (
          <div className="absolute z-40" style={{ left: `${popupPos.x}px`, top: `${popupPos.y}px` }}>
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-500">
              Loading suggestions...
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 px-6 py-2 text-xs text-gray-500">
        {wordCount} words • {acceptedCount} accepted
      </div>
    </div>
  )
}
